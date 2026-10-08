import { TICKET_TEMPLATES, type TemplateId } from "@/lib/ticket-templates";

type TemplatePickerProps = {
  value: TemplateId;
  onChange: (templateId: TemplateId) => void;
};

function TemplateSketch({ id }: { id: TemplateId }) {
  if (id === "bold") {
    return (
      <span aria-hidden className="flex h-11 flex-col overflow-hidden rounded bg-ticket-paper">
        <span className="h-4 bg-ticket-accent" />
      </span>
    );
  }
  if (id === "minimal") {
    return (
      <span aria-hidden className="flex h-11 flex-col gap-1 rounded bg-ticket-paper p-1.5">
        <span className="h-1 w-3/5 rounded-sm bg-ticket-ink" />
        <span className="h-[3px] w-2/5 rounded-sm bg-ticket-rule" />
        <span className="h-[3px] w-2/5 rounded-sm bg-ticket-rule" />
      </span>
    );
  }
  return (
    <span aria-hidden className="flex h-11 overflow-hidden rounded bg-ticket-paper">
      <span className="w-1.5 bg-ticket-accent" />
      <span className="flex-1 border-r-2 border-dashed border-ticket-rule" />
      <span className="w-3.5" />
    </span>
  );
}

export default function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  return (
    <fieldset className="border-b border-border p-4">
      <legend className="float-left mb-3 w-full text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Template
      </legend>
      <div className="clear-left grid grid-cols-3 gap-2">
        {TICKET_TEMPLATES.map((template) => (
          <label
            key={template.id}
            className="group flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-bg p-2 hover:border-border-strong has-checked:border-accent has-checked:ring-3 has-checked:ring-accent/35 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name="template"
              value={template.id}
              checked={value === template.id}
              onChange={() => onChange(template.id)}
              className="sr-only"
            />
            <TemplateSketch id={template.id} />
            <span className="text-center text-xs text-muted group-has-checked:text-text">
              {template.name}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
