import { createClient } from "@/lib/supabase/server";

export type EventType = "event" | "festival" | "marathon" | "milonga";

export type EventRow = {
  id: string;
  type: EventType | null;
  city: string | null;
  state: string | null;
  venue: string | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  recurring: string | null;
  price: string | null;
  website_url: string | null;
  title_ko: string | null;
  title_en: string | null;
  title_es: string | null;
  title_ja: string | null;
  title_zh: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_es: string | null;
  description_ja: string | null;
  description_zh: string | null;
};

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function localizedTitle(event: EventRow, locale: string): string {
  const key = `title_${locale}` as keyof EventRow;
  return (event[key] as string | null) || event.title_ko || event.title_en || "";
}

type CityFilter = { city?: string; state?: string | null; type?: string };

export async function getUpcomingEvents({
  city,
  state,
  type,
  beforeDate,
}: CityFilter & { beforeDate?: string }): Promise<EventRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .gte("start_date", todayISODate())
    .order("start_date", { ascending: true })
    .limit(200);

  if (city) query = query.eq("city", city);
  if (state) query = query.eq("state", state);
  if (type) query = query.eq("type", type);
  if (beforeDate) query = query.lte("start_date", beforeDate);

  const { data } = await query;
  return (data as EventRow[]) ?? [];
}

export async function getMonthEvents({
  city,
  state,
  type,
  monthStart,
  monthEnd,
}: CityFilter & { monthStart: string; monthEnd: string }): Promise<EventRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .lte("start_date", monthEnd)
    .order("start_date", { ascending: true });

  if (city) query = query.eq("city", city);
  if (state) query = query.eq("state", state);
  if (type) query = query.eq("type", type);

  const { data } = await query;
  const rows = (data as EventRow[]) ?? [];

  const lowerBound = monthStart > todayISODate() ? monthStart : todayISODate();
  return rows.filter((event) => {
    const effectiveEnd = event.end_date ?? event.start_date ?? "";
    return effectiveEnd >= lowerBound;
  });
}

export async function getDistinctCities(): Promise<
  { city: string; state: string | null }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("city, state")
    .eq("status", "approved")
    .gte("start_date", todayISODate());

  const seen = new Map<string, { city: string; state: string | null }>();
  for (const row of data ?? []) {
    if (!row.city) continue;
    const key = `${row.city}|${row.state ?? ""}`;
    if (!seen.has(key)) seen.set(key, { city: row.city, state: row.state });
  }
  return [...seen.values()].sort((a, b) => a.city.localeCompare(b.city));
}
