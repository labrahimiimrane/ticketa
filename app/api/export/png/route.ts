import { exportRequestSchema } from "@/lib/export/export-request";
import { renderTicketPng } from "@/lib/export/render-ticket";

const MAX_BODY_BYTES = 32 * 1024;

/** Reads the body as text, or returns null once it exceeds the limit. */
async function readBodyWithLimit(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_BODY_BYTES) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export async function POST(request: Request) {
  const body = await readBodyWithLimit(request);
  if (body === null) return Response.json({ error: "too_large" }, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = exportRequestSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "invalid_ticket" }, { status: 400 });

  try {
    const png = await renderTicketPng(parsed.data);
    return new Response(Buffer.from(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="ticket-${parsed.data.ticketId}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PNG export failed", error);
    return Response.json({ error: "render_failed" }, { status: 500 });
  }
}
