"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { EventType } from "@/lib/events/queries";
import { eventTypeLabel } from "@/lib/events/labels";

const ORDERED_TYPES: EventType[] = ["festival", "marathon", "event", "milonga"];

const activeClass =
  "rounded-full bg-black px-3 py-1 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black";
const inactiveClass =
  "rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300";

export default function EventFilters({
  currentType,
  basePath,
  extraQuery = {},
}: {
  currentType?: string;
  basePath: "/events" | "/calendar";
  extraQuery?: Record<string, string>;
}) {
  const locale = useLocale();

  return (
    <div className="flex w-full max-w-3xl flex-wrap items-center gap-2">
      <Link
        href={{ pathname: basePath, query: { ...extraQuery } }}
        className={!currentType ? activeClass : inactiveClass}
      >
        {locale === "en" ? "All" : "전체"}
      </Link>

      {ORDERED_TYPES.map((type) => {
        const isActive = currentType === type;
        const query: Record<string, string> = { ...extraQuery, type };
        return (
          <Link
            key={type}
            href={{ pathname: basePath, query }}
            className={isActive ? activeClass : inactiveClass}
          >
            {eventTypeLabel(type, locale)}
          </Link>
        );
      })}
    </div>
  );
}
