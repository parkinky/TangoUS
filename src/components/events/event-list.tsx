import type { EventRow } from "@/lib/events/queries";
import { localizedTitle } from "@/lib/events/queries";
import { EVENT_TYPE_LABELS, formatEventDateRange } from "@/lib/events/labels";

function eventLine(event: EventRow, locale: string): string {
  const parts = [
    formatEventDateRange(event.start_date, event.end_date),
    event.type ? EVENT_TYPE_LABELS[event.type] : "",
    localizedTitle(event, locale),
    event.city ?? "",
    event.state ?? "",
    event.address ?? event.venue ?? "",
  ];
  return parts.join(" / ");
}

export default function EventList({
  events,
  locale,
}: {
  events: EventRow[];
  locale: string;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        예정된 이벤트가 없습니다.
      </p>
    );
  }

  return (
    <ul className="w-full max-w-3xl space-y-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-md border border-zinc-200 p-2 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
        >
          {eventLine(event, locale)}
          {event.website_url && (
            <>
              {" / "}
              <a
                href={event.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                자세히 보기
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
