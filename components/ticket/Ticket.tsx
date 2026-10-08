import BoldTicket from "@/components/ticket/BoldTicket";
import ClassicTicket from "@/components/ticket/ClassicTicket";
import MinimalTicket from "@/components/ticket/MinimalTicket";
import type { TemplateProps } from "@/components/ticket/ticket-parts";
import type { TemplateId } from "@/lib/ticket-templates";

type TicketProps = TemplateProps & {
  templateId: TemplateId;
};

const TEMPLATES: Record<TemplateId, (props: TemplateProps) => React.ReactElement> = {
  classic: ClassicTicket,
  bold: BoldTicket,
  minimal: MinimalTicket,
};

export default function Ticket({ templateId, ...props }: TicketProps) {
  const Template = TEMPLATES[templateId];
  return <Template {...props} />;
}
