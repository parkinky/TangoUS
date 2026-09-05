import type { EventRow, EventType } from "./queries";
import { localizedTitle } from "./queries";
import { EVENT_TYPE_LABELS } from "./labels";

// Generic words that show up in almost every title and would otherwise cause
// unrelated events to look like a name match (e.g. every title has "Tango"
// and a year).
const STOPWORDS = new Set([
  "tango", "the", "a", "an", "at", "in", "on", "of", "for", "&", "and",
  "festival", "milonga", "marathon", "encuentro", "presents", "de", "la", "el",
]);

function significantWords(title: string | null): Set<string> {
  if (!title) return new Set();
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w) && !/^\d{4}$/.test(w));
  return new Set(words);
}

function sharedWordCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const word of a) {
    if (b.has(word)) count++;
  }
  return count;
}

// Two rows are treated as the same real-world happening (a festival scraped
// alongside its own satellite milonga, or a plain duplicate scrape) when they
// run over the exact same dates and their titles share at least 3 distinct
// words once generic tango/year words are ignored.
function isSameEvent(a: EventRow, b: EventRow): boolean {
  if (a.start_date !== b.start_date || a.end_date !== b.end_date) return false;

  // Short titles (e.g. "Utopia Encuentro 2026") can lose almost every word
  // to stopword/year filtering, leaving too few left to reach the word-count
  // threshold below even when the two titles are the same. An exact match on
  // either language's title is a safe merge on its own.
  if (a.title_en && b.title_en && a.title_en.trim().toLowerCase() === b.title_en.trim().toLowerCase()) {
    return true;
  }
  if (a.title_ko && b.title_ko && a.title_ko.trim() === b.title_ko.trim()) {
    return true;
  }

  const aWords = new Set([
    ...significantWords(a.title_ko),
    ...significantWords(a.title_en),
  ]);
  const bWords = new Set([
    ...significantWords(b.title_ko),
    ...significantWords(b.title_en),
  ]);

  return sharedWordCount(aWords, bWords) >= 3;
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
  address: string | null;
  websiteUrl: string | null;
};

export function mergeEvents(events: EventRow[], locale: string): MergedEvent[] {
  const used = new Array(events.length).fill(false);
  const groups: EventRow[][] = [];

  for (let i = 0; i < events.length; i++) {
    if (used[i]) continue;
    const group = [events[i]];
    used[i] = true;
    for (let j = i + 1; j < events.length; j++) {
      if (used[j]) continue;
      if (isSameEvent(events[i], events[j])) {
        group.push(events[j]);
        used[j] = true;
      }
    }
    groups.push(group);
  }

  const merged = groups.map((group): MergedEvent => {
    const types = new Set(
      group.map((e) => e.type).filter((t): t is EventType => Boolean(t))
    );

    const categoryLabel = types.has("festival")
      ? "페스티벌+밀롱가"
      : EVENT_TYPE_LABELS[
          TYPE_PRIORITY.find((t) => types.has(t)) ?? "event"
        ];

    let representative = group[0];
    for (const type of TYPE_PRIORITY) {
      const found = group.find((e) => e.type === type);
      if (found) {
        representative = found;
        break;
      }
    }

    const websiteUrl = group.find((e) => e.website_url)?.website_url ?? null;

    return {
      id: representative.id,
      start_date: representative.start_date,
      end_date: representative.end_date,
      categoryLabel,
      title: localizedTitle(representative, locale),
      city: representative.city,
      state: representative.state,
      address: representative.address ?? representative.venue ?? null,
      websiteUrl,
    };
  });

  return merged.sort((a, b) =>
    (a.start_date ?? "").localeCompare(b.start_date ?? "")
  );
}
