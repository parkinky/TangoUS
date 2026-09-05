import type { EventType } from "./queries";

const EVENT_TYPE_LABELS_KO: Record<EventType, string> = {
  event: "엔쿠엔트로",
  festival: "페스티벌",
  marathon: "마라톤",
  milonga: "밀롱가",
};

const EVENT_TYPE_LABELS_EN: Record<EventType, string> = {
  event: "Encuentro",
  festival: "Festival",
  marathon: "Marathon",
  milonga: "Milonga",
};

// Kept for the call sites (admin, submit form) that don't yet carry a
// locale — always Korean, matching their previous behavior.
export const EVENT_TYPE_LABELS = EVENT_TYPE_LABELS_KO;

export function eventTypeLabel(type: EventType, locale: string): string {
  return locale === "en" ? EVENT_TYPE_LABELS_EN[type] : EVENT_TYPE_LABELS_KO[type];
}

export function festivalMilongaLabel(locale: string): string {
  return locale === "en" ? "Festival+Milonga" : "페스티벌+밀롱가";
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function weekdayLabels(locale: string): string[] {
  return locale === "en" ? WEEKDAYS_EN : WEEKDAYS_KO;
}

function dateParts(dateStr: string, locale: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const weekday = weekdayLabels(locale)[date.getDay()];
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), weekday };
}

// A single day renders as one line; a range renders as two lines — the
// start date, and the end date below it prefixed with "~".
export function formatEventDateRange(
  startDate: string | null,
  endDate: string | null,
  locale: string
): [string] | [string, string] {
  if (!startDate) return [locale === "en" ? "Date TBD" : "날짜 미정"];

  const start = dateParts(startDate, locale);
  const startStr =
    locale === "en"
      ? `${MONTHS_EN[start.month - 1]} ${start.day}, ${start.year} (${start.weekday})`
      : `${start.year}년${start.month}월${start.day}일(${start.weekday})`;

  if (!endDate || endDate === startDate) return [startStr];

  const end = dateParts(endDate, locale);
  const endStr =
    locale === "en"
      ? `${MONTHS_EN[end.month - 1]} ${end.day}, ${end.year} (${end.weekday})`
      : end.year === start.year
      ? `${end.month}월${end.day}일(${end.weekday})`
      : `${end.year}년${end.month}월${end.day}일(${end.weekday})`;

  return [startStr, `~${endStr}`];
}

// Raw price text often carries extra description ("$45 early bird, $60 at
// door, includes Saturday party") — the table column only has room for the
// numbers themselves.
export function formatPrice(price: string | null): string | null {
  if (!price) return null;
  const amounts = price.match(/\$\d+(?:,\d{3})*(?:\.\d+)?/g);
  if (!amounts) return null;
  return amounts.join(" / ");
}
