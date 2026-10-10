import chromium from "@sparticuz/chromium";
import puppeteerCore, { type Browser, type Page } from "puppeteer-core";

import type { ExportRequest } from "@/lib/export/export-request";

const TIMEOUT_MS = 20_000;
const SCALE = 3;

// Always fixed server configuration, never the request's Host header, so callers
// cannot point the server's browser at another site. On Vercel there is no local
// server, so the function loads the deployment's own public URL instead.
function renderOrigin(): string {
  const { RENDER_ORIGIN, VERCEL_ENV, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL, PORT } =
    process.env;
  const origin =
    RENDER_ORIGIN ??
    (VERCEL_ENV === "production" && VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${VERCEL_PROJECT_PRODUCTION_URL}`
      : VERCEL_URL
        ? `https://${VERCEL_URL}`
        : `http://127.0.0.1:${PORT ?? 3000}`);
  return new URL(origin).origin;
}

// Vercel functions cannot fit Puppeteer's Chrome, so they use the serverless
// Chromium build; local runs use the Chrome that the `puppeteer` dev package installs.
async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    return puppeteerCore.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: true,
      timeout: TIMEOUT_MS,
    });
  }
  const { default: puppeteer } = await import("puppeteer");
  return puppeteer.launch({ headless: true, timeout: TIMEOUT_MS });
}

/** Renders the ticket with the app's own render page and returns PNG bytes at 3x. */
export function renderTicketPng(data: ExportRequest): Promise<Uint8Array> {
  return withRenderedTicket(data, "PNG", async (page) => {
    const ticket = await page.$("[data-render-root] article");
    if (!ticket) throw new Error("Rendered ticket not found");
    return ticket.screenshot({ type: "png", omitBackground: true });
  });
}

/** Renders the ticket centered at true size on one A4 landscape page. */
export function renderTicketPdf(data: ExportRequest): Promise<Uint8Array> {
  return withRenderedTicket(data, "PDF", (page) =>
    page.pdf({ format: "A4", landscape: true, printBackground: true, preferCSSPageSize: true }),
  );
}

async function withRenderedTicket<T>(
  data: ExportRequest,
  format: string,
  use: (page: Page) => Promise<T>,
): Promise<T> {
  // The deadline covers launching Chrome too, not just the page work.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${format} render timed out`)), TIMEOUT_MS);
  });
  const launching = launchBrowser();
  const rendering = launching.then((browser) => openTicketPage(browser, data)).then(use);

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

async function openTicketPage(browser: Browser, data: ExportRequest): Promise<Page> {
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
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  return page;
}
