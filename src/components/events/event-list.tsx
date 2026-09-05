import type { EventRow } from "@/lib/events/queries";
import { localizedTitle } from "@/lib/events/queries";
import { EVENT_TYPE_LABELS, formatDateHeading } from "@/lib/events/labels";

function groupByDate(events: EventRow[]) {
  const groups = new Map<string, EventRow[]>();
  for (const event of events) {
    const key = event.start_date ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return [...groups.entries()];
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

  const groups = groupByDate(events);

  return (
    <div className="w-full max-w-3xl space-y-6">
      {groups.map(([date, dayEvents]) => (
        <div key={date}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {date ? formatDateHeading(date) : "날짜 미정"}
          </h2>
          <ul className="space-y-2">
            {dayEvents.map((event) => (
              <li
                key={event.id}
                className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
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
                  </div>
                  {event.type && (
                    <span className="shrink-0 rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                      {EVENT_TYPE_LABELS[event.type]}
                    </span>
                  )}
                </div>
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
        </div>
      ))}
    </div>
  );
}
