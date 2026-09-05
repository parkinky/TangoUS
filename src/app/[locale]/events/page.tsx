import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveCityContext } from "@/lib/events/city-context";
import { getUpcomingEvents } from "@/lib/events/queries";
import EventFilters from "@/components/events/event-filters";
import EventList from "@/components/events/event-list";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const ALLOWED_MONTHS = [3, 6, 12] as const;

function parseMonthsParam(raw: string | undefined): (typeof ALLOWED_MONTHS)[number] {
  const n = Number(raw);
  return (ALLOWED_MONTHS as readonly number[]).includes(n)
    ? (n as (typeof ALLOWED_MONTHS)[number])
    : 12;
}

export default async function EventsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/events">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const type = typeof sp.type === "string" ? sp.type : undefined;
  const months = parseMonthsParam(
    typeof sp.months === "string" ? sp.months : undefined
  );

  const now = new Date();
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, now.getUTCDate())
  );
  const beforeDate = cutoff.toISOString().slice(0, 10);
  const periodEndLabel = `${cutoff.getUTCFullYear()}년 ${cutoff.getUTCMonth() + 1}월`;

  const extraQuery: Record<string, string> = { months: String(months) };

  const cityCtx = await resolveCityContext();

  const events = await getUpcomingEvents({
    city: cityCtx.selected?.city,
    state: cityCtx.selected?.state,
    type,
    beforeDate,
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-6 py-16 dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        다가오는 이벤트
      </h1>
      <EventFilters
        cityOptions={cityCtx.options}
        selectedCity={cityCtx.selected}
        currentType={type}
        basePath="/events"
        extraQuery={extraQuery}
        period={{ months, endLabel: periodEndLabel }}
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        {cityCtx.selected
          ? `${cityCtx.selected.city}${cityCtx.selected.state ? ", " + cityCtx.selected.state : ""} 이벤트만 표시 중`
          : "전체 도시의 이벤트를 표시 중"}
      </p>
      <EventList events={events} locale={locale} />
    </div>
  );
}
