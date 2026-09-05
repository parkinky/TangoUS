import type { EventType } from "./queries";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  event: "엔쿠엔트로",
  festival: "페스티벌",
  marathon: "마라톤",
  milonga: "밀롱가",
};

export function formatDateHeading(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}
