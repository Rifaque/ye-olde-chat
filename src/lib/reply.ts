import type { ReplyIntent } from "./concepts.ts";
import { analyze, indexCorpus, sharesSense, type IndexedPhrase } from "./phrase-index.ts";
import type { Phrase } from "./phrases.ts";
import { containsRun } from "./text.ts";

export type ReplyMatch = { phrase: Phrase; score: number };

export const MAX_REPLY_MESSAGE_LENGTH = 500;

const WEIGHT = {
  /** Multiplied by the concept's rarity, so "banned" says more than "amazing". */
  concept: 10,
  cueBase: 12,
  cuePerWord: 6,
  echoExact: 30,
  echoRun: 15,
  sharedSlangWord: 8,
  extraTagDiscount: 0.15,
} as const;

/**
 * Picks curated phrases that answer a pasted message. Nothing is written or
 * rewritten here: every result is an untouched entry from the corpus, ranked by
 *
 * - situation concepts the message evokes that the phrase is tagged with,
 * - the phrase's reply cues appearing verbatim in the message,
 * - the message quoting the phrase's own slang ("gg" → GG, GG WP),
 *
 * and, when an intent is chosen, only phrases that make that kind of reply.
 */
export function findReplies(
  phrases: readonly Phrase[],
  message: string,
  { intent, limit = 12 }: { intent?: ReplyIntent | null; limit?: number } = {},
): ReplyMatch[] {
  const index = indexCorpus(phrases);
  const analyzed = analyze(message.slice(0, MAX_REPLY_MESSAGE_LENGTH));
  if (!analyzed.text) return [];

  const contentSet = new Set(analyzed.content);
  const score = (entry: IndexedPhrase) => {
    let conceptScore = 0;
    for (const concept of analyzed.concepts) {
      if (entry.tags.has(concept)) conceptScore += WEIGHT.concept * index.conceptWeight(concept);
    }
    // A phrase about exactly this situation beats one that merely touches it.
    let total = conceptScore / (1 + WEIGHT.extraTagDiscount * Math.max(entry.tags.size - 1, 0));
    for (const cue of entry.replyTo) {
      if (containsRun(analyzed.stems, cue)) total += WEIGHT.cueBase + WEIGHT.cuePerWord * cue.length;
    }
    if (entry.slang === analyzed.text || entry.aliases.includes(analyzed.text)) total += WEIGHT.echoExact;
    else if (entry.slangStems.length > 1 && containsRun(analyzed.stems, entry.slangStems)) total += WEIGHT.echoRun;
    for (const word of new Set(entry.slangStems)) {
      if (word.length > 2 && contentSet.has(word) && sharesSense(entry, word)) total += WEIGHT.sharedSlangWord;
    }
    return total;
  };

  const ranked = index.entries
    .filter((entry) => !intent || entry.intents.has(intent))
    .map((entry) => ({ entry, score: score(entry) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order);

  const top = ranked[0]?.score ?? 0;
  return ranked
    .filter((match) => match.score >= top * 0.25)
    .slice(0, limit)
    .map(({ entry, score: value }) => ({ phrase: entry.phrase, score: Math.round(value * 100) / 100 }));
}
