import type { EventRow } from "@/lib/events/queries";
import { localizedTitle, todayISODate } from "@/lib/events/queries";
import { eventTypeLabel, weekdayLabels } from "@/lib/events/labels";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function EventCalendar({
  year,
  month, // 0-indexed
  events,
  locale,
}: {
  year: number;
  month: number;
  events: EventRow[];
  locale: string;
}) {
  const monthStartDate = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = monthStartDate.getUTCDay();
  const today = todayISODate();

  const eventsByDay = new Map<number, EventRow[]>();
  for (const event of events) {
    const rawStart = event.start_date ?? "";
    const rawEnd = event.end_date ?? event.start_date ?? "";
    let cursor = new Date(`${rawStart}T00:00:00Z`);
    const end = new Date(`${rawEnd}T00:00:00Z`);
    while (cursor <= end) {
      const dayStr = cursor.toISOString().slice(0, 10);
      if (
        cursor.getUTCFullYear() === year &&
        cursor.getUTCMonth() === month &&
        dayStr >= today
      ) {
        const day = cursor.getUTCDate();
        if (!eventsByDay.has(day)) eventsByDay.set(day, []);
        eventsByDay.get(day)!.push(event);
      }
      cursor = new Date(cursor.getTime() + 86400000);
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = chunk(cells, 7);

  const weekdays = weekdayLabels(locale);

  return (
    <div className="w-full max-w-4xl overflow-x-auto">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
        <thead>
          <tr>
            {weekdays.map((w) => (
              <th
                key={w}
                className="border border-zinc-200 p-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((day, j) => {
                const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
                return (
                  <td
                    key={j}
                    className="h-28 max-w-0 border border-zinc-200 p-1 align-top dark:border-zinc-800"
                  >
                    {day && (
                      <>
                        <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {day}
                        </p>
                        <ul className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <li
                              key={event.id}
                              title={
                                event.type
                                  ? `${eventTypeLabel(event.type, locale)}: ${localizedTitle(event, locale)}`
                                  : localizedTitle(event, locale)
                              }
                              className="truncate rounded bg-zinc-100 px-1 text-xs text-black dark:bg-zinc-900 dark:text-zinc-50"
                            >
                              {localizedTitle(event, locale)}
                            </li>
                          ))}
                          {dayEvents.length > 3 && (
                            <li className="text-xs text-zinc-500 dark:text-zinc-400">
                              {locale === "en"
                                ? `+${dayEvents.length - 3} more`
                                : `+${dayEvents.length - 3}개 더보기`}
                            </li>
                          )}
                        </ul>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
