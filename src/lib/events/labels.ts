import type { EventType } from "./queries";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  event: "엔쿠엔트로",
  festival: "페스티벌",
  marathon: "마라톤",
  milonga: "밀롱가",
};

function dateParts(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), weekday };
}

export function formatEventDateRange(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate) return "날짜 미정";

  const start = dateParts(startDate);
  const startStr = `${start.year}년${start.month}월${start.day}일(${start.weekday})`;

  if (!endDate || endDate === startDate) return startStr;

  const end = dateParts(endDate);
  const endStr =
    end.year === start.year
      ? `${end.month}월${end.day}일(${end.weekday})`
      : `${end.year}년${end.month}월${end.day}일(${end.weekday})`;

  return `${startStr}~${endStr}`;
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
