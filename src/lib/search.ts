import { analyze, conceptsForStem, indexCorpus, sharesSense, type AnalyzedText, type IndexedPhrase } from "./phrase-index.ts";
import type { CategoryId, Phrase } from "./phrases.ts";
import { containsRun, editDistance, typoBudget } from "./text.ts";

export { normalize } from "./text.ts";

export type CategoryFilter = CategoryId | "all";

export type SearchResult = { phrase: Phrase; score: number };

/*
 * Scoring has two layers that add together.
 *
 * Literal: how the query compares with the slang and aliases as whole strings.
 * Tiers are far enough apart that nothing in the semantic layer can lift a
 * weaker literal match over a stronger one, so "L" always leads with the
 * phrase "L", and "GG" puts "GG" ahead of "GG WP".
 *
 * Semantic: each meaningful query word earns the best of its matches against
 * the phrase's slang words, alias words, situation tags, reply cues and
 * translation. That is what lets "my teammate is terrible" find "Team diff".
 */
const LITERAL = {
  exactSlang: 1000,
  exactAlias: 900,
  slangLeadingWord: 780,
  slangPrefix: 700,
  aliasPrefix: 600,
  slangWord: 550,
  aliasWord: 500,
  slangWords: 450,
  slangInside: 400,
  aliasInside: 350,
  fuzzyWhole: 320,
  fuzzyPrefix: 240,
  fuzzyPenalty: 60,
} as const;

const SEMANTIC = {
  slangWord: 120,
  aliasWord: 100,
  fuzzySlangWord: 70,
  tag: 60,
  replyCue: 50,
  translationWord: 35,
  intent: 40,
  /** Multiplier when every meaningful query word found something. */
  fullCoverage: 1.25,
  replyPhraseBase: 30,
  replyPhrasePerWord: 25,
} as const;

const MINIMUM_SCORE = 30;

function literalScore(entry: IndexedPhrase, query: AnalyzedText): number {
  const { text, compact } = query;
  const lengthPenalty = (value: string) => Math.min(Math.max(value.length - text.length, 0), 60);

  if (entry.slang === text || entry.slangCompact === compact) return LITERAL.exactSlang;
  if (entry.aliases.includes(text) || entry.aliasCompacts.includes(compact)) return LITERAL.exactAlias;
  if (entry.slang.startsWith(`${text} `)) return LITERAL.slangLeadingWord - lengthPenalty(entry.slang);
  if (entry.slang.startsWith(text)) return LITERAL.slangPrefix - lengthPenalty(entry.slang);
  if (entry.aliases.some((alias) => alias.startsWith(text))) return LITERAL.aliasPrefix;
  if (` ${entry.slang}`.includes(` ${text}`)) return LITERAL.slangWord - lengthPenalty(entry.slang);
  if (entry.aliases.some((alias) => ` ${alias}`.includes(` ${text}`))) return LITERAL.aliasWord;
  // "cooked" finds "Let him cook", but a whole sentence merely mentioning "talk" is not a slang match.
  if (
    query.content.length > 0 &&
    query.stems.length <= entry.slangStems.length + 1 &&
    query.content.every((word) => entry.slangStems.includes(word) && sharesSense(entry, word))
  ) {
    return LITERAL.slangWords - lengthPenalty(entry.slang);
  }
  if (compact.length >= 3 && entry.slangCompact.includes(compact)) return LITERAL.slangInside;
  if (compact.length >= 3 && entry.aliasCompacts.some((alias) => alias.includes(compact))) return LITERAL.aliasInside;

  // A lone word the vocabulary already knows ("roast", "lying") is not a typo of some slang.
  const knownWord = query.content.length === 1 && (query.concepts.size > 0 || query.intents.size > 0);
  const budget = knownWord ? 0 : typoBudget(compact.length);
  if (budget === 0) return 0;
  const candidates = [entry.slangCompact, ...entry.aliasCompacts];
  const whole = Math.min(...candidates.map((candidate) => editDistance(compact, candidate, budget)));
  if (whole <= budget) return LITERAL.fuzzyWhole - LITERAL.fuzzyPenalty * whole;
  // Still typing: "residentslep" is a typo'd start of "residentsleeper".
  if (compact.length >= 5) {
    const prefix = Math.min(
      ...candidates
        .filter((candidate) => candidate.length > compact.length)
        .map((candidate) => editDistance(compact, candidate.slice(0, compact.length), 1)),
    );
    if (prefix <= 1) return LITERAL.fuzzyPrefix;
  }
  return 0;
}

function semanticScore(entry: IndexedPhrase, query: AnalyzedText): number {
  let score = 0;
  let matched = 0;

  for (const word of query.content) {
    let best = 0;
    const sameSense = sharesSense(entry, word);
    if (sameSense && entry.slangStems.includes(word)) best = SEMANTIC.slangWord;
    else if (sameSense && entry.aliasStems.has(word)) best = SEMANTIC.aliasWord;
    else if (word.length >= 5 && conceptsForStem(word).length === 0) {
      // Known situation words are never typos: "talk" must not fuzzily become "tank".
      const budget = typoBudget(word.length);
      if (budget > 0 && entry.slangStems.some((slangWord) => slangWord.length >= 3 && editDistance(word, slangWord, budget) <= budget)) {
        best = SEMANTIC.fuzzySlangWord;
      }
    }
    if (conceptsForStem(word).some((concept) => entry.tags.has(concept))) best = Math.max(best, SEMANTIC.tag);
    if (entry.replyTo.some((cue) => cue.includes(word))) best = Math.max(best, SEMANTIC.replyCue);
    if (word.length > 2 && entry.translationStems.has(word)) best = Math.max(best, SEMANTIC.translationWord);
    if (best > 0) matched++;
    score += best;
  }

  if (matched > 1 && matched === query.content.length) score *= SEMANTIC.fullCoverage;

  for (const cue of entry.replyTo) {
    if (cue.length > 1 && containsRun(query.stems, cue)) {
      score += SEMANTIC.replyPhraseBase + SEMANTIC.replyPhrasePerWord * cue.length;
    }
  }
  for (const intent of query.intents) {
    if (entry.intents.has(intent)) score += SEMANTIC.intent;
  }
  return score;
}

/** Ranks phrases for a query, best first. A blank query returns the corpus order. */
export function searchPhrases(
  phrases: readonly Phrase[],
  { query, category }: { query: string; category: CategoryFilter },
): SearchResult[] {
  const { entries } = indexCorpus(phrases);
  const pool = category === "all" ? entries : entries.filter((entry) => entry.phrase.category === category);
  const analyzed = analyze(query);
  if (!analyzed.text) return pool.map((entry) => ({ phrase: entry.phrase, score: 0 }));

  const scored = pool
    .map((entry) => ({ entry, score: literalScore(entry, analyzed) + semanticScore(entry, analyzed) }))
    .filter(({ score }) => score >= MINIMUM_SCORE)
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order);

  // Drop the long tail of faint matches once something clearly relevant exists:
  // a strong literal hit tolerates less noise than a loose situational query.
  const top = scored[0]?.score ?? 0;
  const floor = top >= LITERAL.slangInside ? top * 0.15 : top * 0.3;
  return scored.filter(({ score }) => score >= floor).map(({ entry, score }) => ({ phrase: entry.phrase, score }));
}

export function filterPhrases(phrases: readonly Phrase[], options: { query: string; category: CategoryFilter }): Phrase[] {
  return searchPhrases(phrases, options).map(({ phrase }) => phrase);
}
