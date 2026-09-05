"use client";

import { Link } from "@/i18n/navigation";
import { setCityFilter } from "@/lib/events/actions";
import type { CityOption } from "@/lib/events/city-context";
import type { EventType } from "@/lib/events/queries";

const TYPE_OPTIONS: { value: EventType | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  { value: "event", label: "이벤트" },
  { value: "festival", label: "페스티벌" },
  { value: "marathon", label: "마라톤" },
  { value: "milonga", label: "밀롱가" },
];

function cityValue(option: { city: string; state: string | null } | null) {
  if (!option) return "";
  return `${option.city}|${option.state ?? ""}`;
}

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
    <div className="w-full max-w-3xl space-y-3">
      <form action={setCityFilter} className="flex items-center gap-2">
        <label htmlFor="city" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          도시
        </label>
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

      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((option) => {
          const isActive = (currentType ?? "") === (option.value ?? "");
          const query: Record<string, string> = { ...extraQuery };
          if (option.value) query.type = option.value;
          return (
            <Link
              key={option.label}
              href={{ pathname: basePath, query }}
              className={
                isActive
                  ? "rounded-full bg-black px-3 py-1 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
                  : "rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              }
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
