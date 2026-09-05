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

export type TitledEvent = {
  title_en: string | null;
  title_ko: string | null;
};

// Two titles are treated as the same real-world event when either language's
// title matches exactly, or when they share at least 3 distinct words once
// generic tango/year words are ignored (short titles can lose almost every
// word to that filtering, so an exact match is checked first as a safe
// merge on its own).
export function titlesLikelyMatch(a: TitledEvent, b: TitledEvent): boolean {
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
