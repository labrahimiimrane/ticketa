export type EventInfo = {
  name: string;
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  /** 24-hour time, "HH:mm". */
  time: string;
  location: string;
  organizer: string;
};

export type AttendeeInfo = {
  name: string;
  email?: string;
};
