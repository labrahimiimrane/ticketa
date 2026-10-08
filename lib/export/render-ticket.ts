import puppeteer, { type Browser } from "puppeteer";

import type { ExportRequest } from "@/lib/export/export-request";

const TIMEOUT_MS = 20_000;
const SCALE = 3;

// Always a fixed local origin, never the request's Host header, so callers
// cannot point the server's browser at another site.
function renderOrigin(): string {
  return new URL(process.env.RENDER_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`)
    .origin;
}

/** Renders the ticket with the app's own render page and returns PNG bytes at 3x. */
export async function renderTicketPng(data: ExportRequest): Promise<Uint8Array> {
  // The deadline covers launching Chrome too, not just the page work.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("PNG render timed out")), TIMEOUT_MS);
  });
  const launching = puppeteer.launch({ headless: true, timeout: TIMEOUT_MS });
  const rendering = launching.then((browser) => screenshotTicket(browser, data));

  try {
    return await Promise.race([rendering, deadline]);
  } finally {
    clearTimeout(timer);
    // A failure after the deadline has already been answered as a timeout.
    rendering.catch(() => {});
    // Close in the background so a slow close never delays the response.
    launching.then(
      (browser) =>
        browser.close().catch((error) => console.error("Closing export browser failed", error)),
      () => {},
    );
  }
}

async function screenshotTicket(browser: Browser, data: ExportRequest): Promise<Uint8Array> {
  const origin = renderOrigin();
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);
  await page.setViewport({ width: 1000, height: 600, deviceScaleFactor: SCALE });

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("data:") || new URL(url).origin === origin) request.continue();
    else request.abort();
  });

  await page.goto(`${origin}/render/ticket`, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.__renderTicket === "function");
  await page.evaluate((ticket) => window.__renderTicket?.(ticket), data);
  await page.waitForSelector('[data-ready="true"] article');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  const ticket = await page.$("[data-render-root] article");
  if (!ticket) throw new Error("Rendered ticket not found");
  return ticket.screenshot({ type: "png", omitBackground: true });
}
