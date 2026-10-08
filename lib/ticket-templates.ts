export const TICKET_WIDTH = 760;
export const TICKET_HEIGHT = 300;

/** IDs are stable keys that saved tickets will reference; never rename them. */
export const TICKET_TEMPLATES = [
  { id: "classic", name: "Classic stub" },
  { id: "bold", name: "Bold header" },
  { id: "minimal", name: "Minimal" },
] as const;

export type TemplateId = (typeof TICKET_TEMPLATES)[number]["id"];

export const DEFAULT_TEMPLATE_ID: TemplateId = "classic";

export const TEMPLATE_IDS = TICKET_TEMPLATES.map((template) => template.id) as [
  TemplateId,
  ...TemplateId[],
];
