import type { Metadata } from "next";

import RenderTicket from "@/components/export/RenderTicket";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function RenderTicketPage() {
  return <RenderTicket />;
}
