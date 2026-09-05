import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDistinctCities, todayISODate } from "./queries";

export const CITY_COOKIE = "city_filter";

export type CityOption = {
  city: string;
  state: string | null;
  label: string;
};

export type CityContext = {
  loggedIn: boolean;
  options: CityOption[];
  selected: { city: string; state: string | null } | null;
};

function cityKey(city: string, state: string | null) {
  return `${city}|${state ?? ""}`;
}

export function parseCityCookieValue(value: string) {
  const [city, state] = value.split("|");
  return { city, state: state || null };
}

export async function resolveCityContext(): Promise<CityContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CITY_COOKIE)?.value;

  const allCities = await getDistinctCities();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("home_city, home_state")
      .eq("id", user.id)
      .maybeSingle();

    const { data: trips } = await supabase
      .from("trip_cities")
      .select("city, state")
      .eq("user_id", user.id)
      .gte("end_date", todayISODate())
      .order("start_date", { ascending: true });

    // Home city and upcoming trips are surfaced first (with a distinct
    // label) since they're the most relevant picks for this user, but every
    // city that actually has events should still be reachable below them —
    // otherwise a user with no home_city/trip_cities set sees an empty
    // dropdown.
    const options: CityOption[] = [];
    if (profile?.home_city) {
      options.push({
        city: profile.home_city,
        state: profile.home_state,
        label: `${profile.home_city}${profile.home_state ? ", " + profile.home_state : ""} (거주 도시)`,
      });
    }
    for (const trip of trips ?? []) {
      if (!trip.city) continue;
      const key = cityKey(trip.city, trip.state);
      if (options.some((o) => cityKey(o.city, o.state) === key)) continue;
      options.push({
        city: trip.city,
        state: trip.state,
        label: `${trip.city}${trip.state ? ", " + trip.state : ""} (여행 예정)`,
      });
    }
    for (const city of allCities) {
      const key = cityKey(city.city, city.state);
      if (options.some((o) => cityKey(o.city, o.state) === key)) continue;
      options.push({
        city: city.city,
        state: city.state,
        label: `${city.city}${city.state ? ", " + city.state : ""}`,
      });
    }

    let selected = options[0] ?? null;
    if (cookieValue) {
      const parsed = parseCityCookieValue(cookieValue);
      const match = options.find(
        (o) => cityKey(o.city, o.state) === cityKey(parsed.city, parsed.state)
      );
      if (match) selected = match;
    }

    return { loggedIn: true, options, selected };
  }

  const options: CityOption[] = allCities.map((c) => ({
    city: c.city,
    state: c.state,
    label: `${c.city}${c.state ? ", " + c.state : ""}`,
  }));

  let selected: CityContext["selected"] = null;
  if (cookieValue) {
    selected = parseCityCookieValue(cookieValue);
  } else {
    const h = await headers();
    const geoCity = h.get("x-vercel-ip-city");
    if (geoCity) {
      selected = {
        city: decodeURIComponent(geoCity),
        state: h.get("x-vercel-ip-country-region"),
      };
    }
  }

  return { loggedIn: false, options, selected };
}
