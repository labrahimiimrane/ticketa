import { handleExport } from "@/lib/export/handle-export";
import { renderTicketPng } from "@/lib/export/render-ticket";

export function POST(request: Request) {
  return handleExport(request, renderTicketPng, { contentType: "image/png", extension: "png" });
}
