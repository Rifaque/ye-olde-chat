import { indexCorpus } from "./phrase-index.ts";
import type { Phrase } from "./phrases.ts";

const WEIGHT = { tag: 10, intent: 4, category: 3, slangWord: 15 } as const;

/** Phrases that share situations, reply intents and wording with `phrase`, best first. */
export function relatedPhrases(phrases: readonly Phrase[], phrase: Phrase, limit = 4): Phrase[] {
  const index = indexCorpus(phrases);
  const source = index.entries.find((entry) => entry.phrase.id === phrase.id);
  if (!source) return [];
  const sourceWords = new Set(source.slangStems.filter((word) => word.length > 1));

  return index.entries
    .filter((entry) => entry !== source)
    .map((entry) => {
      let score = 0;
      for (const tag of entry.tags) if (source.tags.has(tag)) score += WEIGHT.tag * index.conceptWeight(tag);
      if (score === 0) return { entry, score };
      for (const intent of entry.intents) if (source.intents.has(intent)) score += WEIGHT.intent;
      if (entry.phrase.category === source.phrase.category) score += WEIGHT.category;
      if (entry.slangStems.some((word) => sourceWords.has(word))) score += WEIGHT.slangWord;
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order)
    .slice(0, limit)
    .map(({ entry }) => entry.phrase);
}
