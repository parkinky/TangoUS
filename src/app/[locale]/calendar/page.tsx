import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { resolveCityContext } from "@/lib/events/city-context";
import { getMonthEvents } from "@/lib/events/queries";
import EventFilters from "@/components/events/event-filters";
import EventCalendar from "@/components/events/event-calendar";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  params,
  searchParams,
}: PageProps<"/[locale]/calendar">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const type = typeof sp.type === "string" ? sp.type : undefined;
  const monthSp = typeof sp.month === "string" ? sp.month : undefined;

  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  if (monthSp && /^\d{4}-\d{2}$/.test(monthSp)) {
    const [y, m] = monthSp.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEndDate = new Date(Date.UTC(year, month + 1, 0));
  const monthEnd = monthEndDate.toISOString().slice(0, 10);

  const cityCtx = await resolveCityContext();

  const events = cityCtx.selected
    ? await getMonthEvents({
        city: cityCtx.selected.city,
        state: cityCtx.selected.state,
        type,
        monthStart,
        monthEnd,
      })
    : [];

  const prevDate = new Date(Date.UTC(year, month - 1, 1));
  const nextDate = new Date(Date.UTC(year, month + 1, 1));
  const extraQuery: Record<string, string> = { month: monthParam(year, month) };

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-6 py-16 dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        이벤트 캘린더
      </h1>
      <EventFilters
        cityOptions={cityCtx.options}
        selectedCity={cityCtx.selected}
        currentType={type}
        basePath="/calendar"
        extraQuery={extraQuery}
      />

      <div className="flex w-full max-w-4xl items-center justify-between">
        <Link
          href={{
            pathname: "/calendar",
            query: {
              ...(type ? { type } : {}),
              month: monthParam(prevDate.getUTCFullYear(), prevDate.getUTCMonth()),
            },
          }}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          이전 달
        </Link>
        <p className="text-lg font-semibold text-black dark:text-zinc-50">
          {year}년 {month + 1}월
        </p>
        <Link
          href={{
            pathname: "/calendar",
            query: {
              ...(type ? { type } : {}),
              month: monthParam(nextDate.getUTCFullYear(), nextDate.getUTCMonth()),
            },
          }}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          다음 달
        </Link>
      </div>

      {!cityCtx.selected ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          이벤트를 보려면 먼저 도시를 선택해주세요.
        </p>
      ) : (
        <EventCalendar year={year} month={month} events={events} locale={locale} />
      )}
    </div>
  );
}
