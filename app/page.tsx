import Ticket from "@/components/ticket/Ticket";
import type { AttendeeInfo, EventInfo } from "@/types/ticket";

const SAMPLE_EVENT: EventInfo = {
  name: "Frontend Nation 2026",
  date: "2026-11-14",
  time: "09:30",
  location: "Beurs van Berlage, Amsterdam",
  organizer: "Northwind Events",
};

const SAMPLE_ATTENDEE: AttendeeInfo = {
  name: "Amina Haddad",
};

export default function Home() {
  return (
    <main className="grid flex-1 place-items-center overflow-auto bg-canvas bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[20px_20px] p-8">
      <Ticket event={SAMPLE_EVENT} attendee={SAMPLE_ATTENDEE} />
    </main>
  );
}
