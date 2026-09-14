import { concepts, intentWords, type ConceptId, type ReplyIntent } from "./concepts.ts";
import type { Phrase } from "./phrases.ts";
import { canonical, compact, stem, stopwords, words } from "./text.ts";

/** Everything search, Find a Reply and related phrases compare, computed once per phrase. */
export type IndexedPhrase = {
  phrase: Phrase;
  /** Position in the corpus; the final, stable tie-breaker. */
  order: number;
  slang: string;
  slangCompact: string;
  slangStems: readonly string[];
  aliases: readonly string[];
  aliasCompacts: readonly string[];
  aliasStems: ReadonlySet<string>;
  translationStems: ReadonlySet<string>;
  tags: ReadonlySet<ConceptId>;
  intents: ReadonlySet<ReplyIntent>;
  replyTo: readonly (readonly string[])[];
};

export type CorpusIndex = {
  entries: readonly IndexedPhrase[];
  /** How informative a concept is: rarer tags weigh more. */
  conceptWeight: (concept: ConceptId) => number;
};

/** A query or pasted message, broken down for matching. */
export type AnalyzedText = {
  text: string;
  compact: string;
  /** Every word, stemmed, in order. */
  stems: readonly string[];
  /** Stems of the words that carry meaning, deduplicated. */
  content: readonly string[];
  /** Concepts evoked by the content words. */
  concepts: ReadonlySet<ConceptId>;
  intents: ReadonlySet<ReplyIntent>;
};

const conceptsByStem = new Map<string, ConceptId[]>();
for (const [concept, terms] of Object.entries(concepts) as [ConceptId, readonly string[]][]) {
  for (const term of terms) {
    const key = stem(term);
    const list = conceptsByStem.get(key) ?? [];
    if (!list.includes(concept)) list.push(concept);
    conceptsByStem.set(key, list);
  }
}

const intentsByStem = new Map<string, ReplyIntent[]>();
for (const [intent, terms] of Object.entries(intentWords) as [ReplyIntent, readonly string[]][]) {
  for (const term of terms) intentsByStem.set(stem(term), [...(intentsByStem.get(stem(term)) ?? []), intent]);
}

export function conceptsForStem(value: string): readonly ConceptId[] {
  return conceptsByStem.get(value) ?? [];
}

/**
 * Whether a word the phrase shares with a query means the same thing in both.
 * "good" names praise, which "Get good" is not about, so that overlap is a
 * coincidence; "cook" in "Let him cook" is not, because the phrase is tagged cook.
 */
export function sharesSense(entry: IndexedPhrase, word: string): boolean {
  const senses = conceptsForStem(word);
  return senses.length === 0 || senses.some((concept) => entry.tags.has(concept));
}

export function analyze(input: string): AnalyzedText {
  const text = canonical(input);
  const tokens = text ? text.split(" ") : [];
  const stems = tokens.map(stem);
  const content = [...new Set(tokens.filter((token) => !stopwords.has(token)).map(stem))];
  const evoked = new Set<ConceptId>();
  const intents = new Set<ReplyIntent>();
  for (const value of content) {
    conceptsForStem(value).forEach((concept) => evoked.add(concept));
    intentsByStem.get(value)?.forEach((intent) => intents.add(intent));
  }
  return { text, compact: compact(text), stems, content, concepts: evoked, intents };
}

const stems = (text: string) => words(text).map(stem);

const indexes = new WeakMap<readonly Phrase[], CorpusIndex>();

/** Builds (once per corpus array) the lookup structures every ranking function shares. */
export function indexCorpus(phrases: readonly Phrase[]): CorpusIndex {
  const cached = indexes.get(phrases);
  if (cached) return cached;

  const entries = phrases.map((phrase, order): IndexedPhrase => {
    const aliases = (phrase.aliases ?? []).map(canonical);
    return {
      phrase,
      order,
      slang: canonical(phrase.slang),
      slangCompact: compact(canonical(phrase.slang)),
      slangStems: stems(phrase.slang),
      aliases,
      aliasCompacts: aliases.map(compact),
      aliasStems: new Set((phrase.aliases ?? []).flatMap(stems)),
      translationStems: new Set(
        words(phrase.translation)
          .filter((word) => word.length > 2 && !stopwords.has(word))
          .map(stem),
      ),
      tags: new Set(phrase.tags),
      intents: new Set(phrase.intents ?? []),
      replyTo: (phrase.replyTo ?? []).map(stems).filter((terms) => terms.length > 0),
    };
  });

  const frequency = new Map<ConceptId, number>();
  for (const entry of entries) entry.tags.forEach((tag) => frequency.set(tag, (frequency.get(tag) ?? 0) + 1));
  const total = Math.max(entries.length, 1);

  const index: CorpusIndex = {
    entries,
    conceptWeight: (concept) => 1 + Math.log(total / (frequency.get(concept) ?? total)),
  };
  indexes.set(phrases, index);
  return index;
}
