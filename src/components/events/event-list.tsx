import type { EventRow, EventType } from "@/lib/events/queries";
import { localizedTitle } from "@/lib/events/queries";
import { EVENT_TYPE_LABELS, formatDateHeading } from "@/lib/events/labels";

const COLUMN_TYPES: EventType[] = ["event", "festival", "marathon", "milonga"];

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
                    className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {event.start_date
                        ? formatDateHeading(event.start_date)
                        : "날짜 미정"}
                    </p>
                    <p className="font-medium text-black dark:text-zinc-50">
                      {localizedTitle(event, locale)}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {event.venue ? `${event.venue} · ` : ""}
                      {event.city}
                      {event.state ? `, ${event.state}` : ""}
                    </p>
                    {event.recurring && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        {event.recurring}
                      </p>
                    )}
                    {event.website_url && (
                      <a
                        href={event.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm underline"
                      >
                        자세히 보기
                      </a>
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
