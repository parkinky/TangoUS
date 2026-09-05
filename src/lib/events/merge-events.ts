import type { EventRow, EventType } from "./queries";
import { localizedTitle } from "./queries";
import { eventTypeLabel, festivalMilongaLabel } from "./labels";
import { titlesLikelyMatch } from "./title-similarity";

function sameCity(a: EventRow, b: EventRow): boolean {
  if (!a.city || !b.city) return false;
  return (
    a.city.trim().toLowerCase() === b.city.trim().toLowerCase() &&
    (a.state ?? "").trim().toLowerCase() === (b.state ?? "").trim().toLowerCase()
  );
}

// Two rows are treated as the same real-world happening when either:
// - one is a festival and the other a milonga in the same city — a festival
//   always runs alongside milongas (pre/after-parties etc.), even when the
//   milonga's own dates fall outside the festival's main dates, or
// - they run over the exact same dates and their titles share at least 3
//   distinct words (or match exactly) once generic tango/year words are
//   ignored — this catches plain duplicate scrapes.
function isSameEvent(a: EventRow, b: EventRow): boolean {
  if (
    ((a.type === "festival" && b.type === "milonga") ||
      (a.type === "milonga" && b.type === "festival")) &&
    sameCity(a, b)
  ) {
    return true;
  }

  if (a.start_date !== b.start_date || a.end_date !== b.end_date) return false;

  return titlesLikelyMatch(a, b);
}

// A festival always runs alongside milongas, so any group containing a
// festival is labeled accordingly. Marathons and milongas are otherwise
// standalone, so a group's label falls back to whichever of these is
// actually present.
const TYPE_PRIORITY: EventType[] = ["festival", "event", "marathon", "milonga"];

export type MergedEvent = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  categoryLabel: string;
  title: string;
  city: string | null;
  state: string | null;
  nat: string | null;
  address: string | null;
  price: string | null;
  websiteUrl: string | null;
};

function find(parent: number[], i: number): number {
  while (parent[i] !== i) {
    parent[i] = parent[parent[i]];
    i = parent[i];
  }
  return i;
}

function union(parent: number[], a: number, b: number): void {
  const rootA = find(parent, a);
  const rootB = find(parent, b);
  if (rootA !== rootB) parent[rootA] = rootB;
}

export function mergeEvents(events: EventRow[], locale: string): MergedEvent[] {
  // Union-find rather than a single pairwise pass: with the festival+milonga
  // rule, a festival can pull in several milongas that aren't otherwise
  // similar to each other, so membership has to propagate transitively
  // through the festival, not just between directly-matching pairs.
  const parent = events.map((_, i) => i);
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (isSameEvent(events[i], events[j])) {
        union(parent, i, j);
      }
    }
  }

  const groupsByRoot = new Map<number, EventRow[]>();
  events.forEach((event, i) => {
    const root = find(parent, i);
    if (!groupsByRoot.has(root)) groupsByRoot.set(root, []);
    groupsByRoot.get(root)!.push(event);
  });

  const merged = [...groupsByRoot.values()].map((group): MergedEvent => {
    const types = new Set(
      group.map((e) => e.type).filter((t): t is EventType => Boolean(t))
    );

    const categoryLabel = types.has("festival")
      ? festivalMilongaLabel(locale)
      : eventTypeLabel(TYPE_PRIORITY.find((t) => types.has(t)) ?? "event", locale);

    let representative = group[0];
    for (const type of TYPE_PRIORITY) {
      const found = group.find((e) => e.type === type);
      if (found) {
        representative = found;
        break;
      }
    }

    const websiteUrl = group.find((e) => e.website_url)?.website_url ?? null;
    const price = representative.price ?? group.find((e) => e.price)?.price ?? null;

    // The merged group can span dates wider than any single row (a festival
    // plus a pre-festival milonga the day before, say), so use the full span
    // across the group rather than just the representative row's own dates.
    let start_date: string | null = null;
    let end_date: string | null = null;
    for (const event of group) {
      if (event.start_date && (!start_date || event.start_date < start_date)) {
        start_date = event.start_date;
      }
      const eventEnd = event.end_date ?? event.start_date;
      if (eventEnd && (!end_date || eventEnd > end_date)) {
        end_date = eventEnd;
      }
    }

    return {
      id: representative.id,
      start_date,
      end_date,
      categoryLabel,
      title: localizedTitle(representative, locale),
      city: representative.city,
      state: representative.state,
      nat: representative.nat,
      address: representative.address ?? representative.venue ?? null,
      price,
      websiteUrl,
    };
  });

  return merged.sort((a, b) =>
    (a.start_date ?? "").localeCompare(b.start_date ?? "")
  );
}
