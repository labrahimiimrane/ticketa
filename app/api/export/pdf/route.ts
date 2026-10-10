import { handleExport } from "@/lib/export/handle-export";
import { renderTicketPdf } from "@/lib/export/render-ticket";

// Covers the 20 s render deadline plus reading the body and closing Chrome.
export const maxDuration = 30;

export function POST(request: Request) {
  return handleExport(request, renderTicketPdf, {
    contentType: "application/pdf",
    extension: "pdf",
  });
}
