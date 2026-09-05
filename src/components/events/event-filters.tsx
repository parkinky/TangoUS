"use client";

import { Link } from "@/i18n/navigation";
import { setCityFilter } from "@/lib/events/actions";
import type { CityOption } from "@/lib/events/city-context";
import type { EventType } from "@/lib/events/queries";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";

const ORDERED_TYPES: EventType[] = ["festival", "marathon", "milonga", "event"];

function cityValue(option: { city: string; state: string | null } | null) {
  if (!option) return "";
  return `${option.city}|${option.state ?? ""}`;
}

const activeClass =
  "rounded-full bg-black px-3 py-1 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black";
const inactiveClass =
  "rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300";

export default function EventFilters({
  cityOptions,
  selectedCity,
  currentType,
  basePath,
  extraQuery = {},
}: {
  cityOptions: CityOption[];
  selectedCity: { city: string; state: string | null } | null;
  currentType?: string;
  basePath: "/events" | "/calendar";
  extraQuery?: Record<string, string>;
}) {
  const selectedValue = cityValue(selectedCity);
  const hasSelectedInOptions = cityOptions.some(
    (o) => cityValue(o) === selectedValue
  );
  const showSelectedFallback = Boolean(selectedCity) && !hasSelectedInOptions;

  return (
    <div className="flex w-full max-w-3xl flex-wrap items-center gap-2">
      <Link
        href={{ pathname: basePath, query: { ...extraQuery } }}
        className={!currentType ? activeClass : inactiveClass}
      >
        전체
      </Link>

      <form action={setCityFilter} className="flex items-center gap-1">
        <select
          id="city"
          name="city"
          defaultValue={selectedValue}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">전체 도시</option>
          {showSelectedFallback && (
            <option value={selectedValue}>
              {`${selectedCity!.city}${selectedCity!.state ? ", " + selectedCity!.state : ""}`}
            </option>
          )}
          {cityOptions.map((option) => (
            <option key={cityValue(option)} value={cityValue(option)}>
              {option.label}
            </option>
          ))}
        </select>
      </form>

      {ORDERED_TYPES.map((type) => {
        const isActive = currentType === type;
        const query: Record<string, string> = { ...extraQuery, type };
        return (
          <Link
            key={type}
            href={{ pathname: basePath, query }}
            className={isActive ? activeClass : inactiveClass}
          >
            {EVENT_TYPE_LABELS[type]}
          </Link>
        );
      })}
    </div>
  );
}
