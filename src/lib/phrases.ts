import type { ConceptId, ReplyIntent } from "./concepts.ts";
import { afk } from "./corpus/afk.ts";
import { argumentsCorpus } from "./corpus/arguments.ts";
import { discord } from "./corpus/discord.ts";
import { gaming } from "./corpus/gaming.ts";
import { internet } from "./corpus/internet.ts";
import { reactions } from "./corpus/reactions.ts";
import { twitch } from "./corpus/twitch.ts";

export const categories = [
  { id: "gaming", label: "Gaming" },
  { id: "internet", label: "Internet" },
  { id: "twitch", label: "Twitch" },
  { id: "arguments", label: "Arguments" },
  { id: "reactions", label: "Praise" },
  { id: "discord", label: "Discord" },
  { id: "afk", label: "AFK & Social" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

/** A phrase as written in a corpus file, before its category is attached. */
export type PhraseEntry = {
  /** Stable, unique, URL-safe identifier. Used in /p/<id> links and global copy counts, so never rename casually. */
  id: string;
  /** The modern slang, as it would be typed in chat. */
  slang: string;
  /** The eloquent rendering that gets copied. Always hand-written. */
  translation: string;
  /** Other spellings or expansions that should find this phrase as if they were its slang. */
  aliases?: readonly string[];
  /** Situation concepts (see concepts.ts) that search and Find a Reply match against. */
  tags: readonly ConceptId[];
  /** The kind of reply this phrase makes, for Find a Reply's optional intent filter. */
  intents?: readonly ReplyIntent[];
  /** Words or short phrases in someone's message that this phrase answers especially well. */
  replyTo?: readonly string[];
};

export type Phrase = PhraseEntry & { category: CategoryId };

const corpus: Record<CategoryId, readonly PhraseEntry[]> = {
  gaming,
  internet,
  twitch,
  arguments: argumentsCorpus,
  reactions,
  discord,
  afk,
};

export const phrases: readonly Phrase[] = categories.flatMap(({ id }) =>
  corpus[id].map((entry): Phrase => ({ ...entry, category: id })),
);

const byId = new Map(phrases.map((phrase) => [phrase.id, phrase]));

export function getPhrase(id: string): Phrase | undefined {
  return byId.get(id);
}

export function isPhraseId(id: unknown): id is string {
  return typeof id === "string" && byId.has(id);
}

export const categoryLabels = Object.fromEntries(categories.map(({ id, label }) => [id, label])) as Record<CategoryId, string>;
