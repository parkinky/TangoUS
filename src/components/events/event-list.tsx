import type { EventRow, EventType } from "@/lib/events/queries";
import { localizedTitle } from "@/lib/events/queries";
import { EVENT_TYPE_LABELS, formatEventDateRange } from "@/lib/events/labels";

const COLUMN_TYPES: EventType[] = ["event", "festival", "marathon", "milonga"];

function eventLine(event: EventRow, type: EventType, locale: string): string {
  const parts = [
    formatEventDateRange(event.start_date, event.end_date),
    EVENT_TYPE_LABELS[type],
    localizedTitle(event, locale),
    event.address ?? event.venue ?? "",
    event.city ?? "",
    event.state ?? "",
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

  const byType = new Map<EventType, EventRow[]>();
  for (const type of COLUMN_TYPES) byType.set(type, []);
  for (const event of events) {
    if (event.type && byType.has(event.type)) {
      byType.get(event.type)!.push(event);
    }
  }

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {COLUMN_TYPES.map((type) => {
        const typeEvents = byType.get(type)!;
        return (
          <div key={type}>
            <h2 className="mb-3 border-b border-zinc-200 pb-2 text-center text-sm font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
              {EVENT_TYPE_LABELS[type]}
            </h2>
            {typeEvents.length === 0 ? (
              <p className="text-center text-sm text-zinc-400 dark:text-zinc-600">
                예정된 {EVENT_TYPE_LABELS[type]}가 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {typeEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-md border border-zinc-200 p-2 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                  >
                    {eventLine(event, type, locale)}
                    {event.website_url && (
                      <>
                        {" · "}
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
            )}
          </div>
        );
      })}
    </div>
  );
}
