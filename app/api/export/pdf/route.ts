import { handleExport } from "@/lib/export/handle-export";
import { renderTicketPdf } from "@/lib/export/render-ticket";

export function POST(request: Request) {
  return handleExport(request, renderTicketPdf, {
    contentType: "application/pdf",
    extension: "pdf",
  });
}
