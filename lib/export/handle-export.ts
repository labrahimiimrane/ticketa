import { exportRequestSchema, type ExportRequest } from "@/lib/export/export-request";

// Fits a 256 KB logo after base64 encoding (about 342 KB) plus the ticket JSON.
const MAX_BODY_BYTES = 512 * 1024;

type ExportFormat = {
  contentType: string;
  extension: "png" | "pdf";
};

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

/** Validates an export request and returns the rendered file or a JSON error. */
export async function handleExport(
  request: Request,
  render: (data: ExportRequest) => Promise<Uint8Array>,
  { contentType, extension }: ExportFormat,
): Promise<Response> {
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
    const file = await render(parsed.data);
    return new Response(Buffer.from(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="ticket-${parsed.data.ticketId}.${extension}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`${extension.toUpperCase()} export failed`, error);
    return Response.json({ error: "render_failed" }, { status: 500 });
  }
}
