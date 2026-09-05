import type { EventRow } from "@/lib/events/queries";
import { formatEventDateRange } from "@/lib/events/labels";
import { mergeEvents } from "@/lib/events/merge-events";

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

  const rows = mergeEvents(events, locale);

  return (
    <div className="w-full max-w-6xl overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-800 dark:border-zinc-200">
            {["기간", "이벤트 종류", "이벤트 이름", "시", "주", "주소", "전체 비용", "기타"].map(
              (heading) => (
                <th
                  key={heading}
                  className="border border-zinc-200 p-2 text-left font-semibold text-black dark:border-zinc-800 dark:text-zinc-50"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="border border-zinc-200 p-2 whitespace-nowrap text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                {formatEventDateRange(row.start_date, row.end_date)}
              </td>
              <td className="border border-zinc-200 p-2 whitespace-nowrap text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                {row.categoryLabel}
              </td>
              <td className="border border-zinc-200 p-2 text-black dark:border-zinc-800 dark:text-zinc-50">
                {row.title}
              </td>
              <td className="border border-zinc-200 p-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                {row.city}
              </td>
              <td className="border border-zinc-200 p-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                {row.state}
              </td>
              <td className="border border-zinc-200 p-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                {row.address ?? "TBD"}
              </td>
              <td className="border border-zinc-200 p-2 whitespace-nowrap text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                {row.price ?? "TBD"}
              </td>
              <td className="border border-zinc-200 p-2 whitespace-nowrap dark:border-zinc-800">
                {row.websiteUrl && (
                  <a
                    href={row.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    자세히 보기
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
