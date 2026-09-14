import type { Metadata, MetadataRoute } from "next";
import { categories, categoryLabels, phrases, type CategoryId, type Phrase } from "./phrases.ts";
import { siteName } from "./site.ts";

/*
 * Search-facing copy and structure, kept in one pure module so pages, the
 * sitemap, robots.txt and tests all agree. Everything here describes the
 * curated corpus; nothing invents content.
 */

type CategorySeo = {
  /** Public URL segment. Stable: changing one breaks inbound links. */
  slug: string;
  /** Link text wherever the category is linked to. */
  navLabel: string;
  /** Visible H1. */
  heading: string;
  /** Document title, before the site name is appended. */
  title: string;
  /** One or two visible sentences under the heading. */
  intro: string;
  /** Meta description; receives the live phrase count. */
  describe: (count: number) => string;
  /** What "browse more …" points at in phrase descriptions. */
  more: string;
  related: readonly CategoryId[];
  /** Shown on the category's social card. */
  featuredPhraseId: string;
};

export const categorySeo: Record<CategoryId, CategorySeo> = {
  gaming: {
    slug: "gaming",
    navLabel: "Gaming phrases",
    heading: "Funny gaming phrases & trash talk",
    title: "Funny Gaming Phrases, Slang & Trash Talk",
    intro: "Callouts, trash talk, lag excuses and clutch reactions for game chat, each rewritten as though a royal herald were typing it.",
    describe: (count) =>
      `${count} funny gaming phrases, from “GG” and “skill issue” to lag excuses and trash talk, rewritten in absurdly formal English. Copy any line straight into game chat.`,
    more: "funny gaming phrases and trash talk",
    related: ["twitch", "arguments", "reactions"],
    featuredPhraseId: "skill-issue",
  },
  internet: {
    slug: "internet",
    navLabel: "Internet slang",
    heading: "Internet slang & meme phrases",
    title: "Funny Internet Slang, Meme Phrases & Gen Z Sayings",
    intro: "Gen Z slang, meme phrases and very online reactions, from “no cap” to “it's joever”, treated with far more dignity than they deserve.",
    describe: (count) =>
      `${count} internet slang terms, meme phrases and Gen Z sayings such as “cooked”, “rizz” and “delulu”, translated into ridiculously eloquent English. Tap to copy.`,
    more: "internet slang and meme phrases",
    related: ["arguments", "reactions", "twitch"],
    featuredPhraseId: "cooked",
  },
  twitch: {
    slug: "twitch",
    navLabel: "Twitch chat phrases",
    heading: "Funny Twitch chat phrases",
    title: "Funny Twitch Chat Phrases & Streamer Slang",
    intro: "Mod calls, emotes, clip requests and chat reactions from every stream you have ever lurked in, given the dignity of a royal court.",
    describe: (count) =>
      `${count} funny Twitch chat phrases and bits of streamer slang, from “MODS!” to “Chat, is this real?”, translated into gloriously overdramatic English. Click to copy.`,
    more: "funny Twitch chat phrases and streamer slang",
    related: ["gaming", "discord", "internet"],
    featuredPhraseId: "mods-alert",
  },
  arguments: {
    slug: "arguments",
    navLabel: "Comebacks & roasts",
    heading: "Funny comebacks & sarcastic replies",
    title: "Funny Comebacks, Roasts & Sarcastic Replies",
    intro: "Roasts, dismissals and unnecessarily formal ways to tell someone they are wrong. For friends, rivals and whoever just said something regrettable.",
    describe: (count) =>
      `${count} funny comebacks, roasts and sarcastic replies, from “who asked?” to “cope and seethe”, delivered with the poise of a disappointed nobleman. Copy one to reply.`,
    more: "funny comebacks, roasts and sarcastic replies",
    related: ["gaming", "internet", "reactions"],
    featuredPhraseId: "who-asked",
  },
  reactions: {
    slug: "praise",
    navLabel: "Compliments & hype",
    heading: "Funny compliments & hype reactions",
    title: "Funny Compliments, Hype Reactions & W Phrases",
    intro: "For clutch plays, great takes and enormous Ws: praise so dramatic it becomes slightly suspicious.",
    describe: (count) =>
      `${count} funny compliments and hype reactions, from “huge W” to “chef's kiss”, inflated into grand, courtly praise. Copy one to celebrate a play, a take or a friend.`,
    more: "funny compliments and hype reactions",
    related: ["gaming", "twitch", "arguments"],
    featuredPhraseId: "chefs-kiss",
  },
  discord: {
    slug: "discord",
    navLabel: "Discord messages",
    heading: "Funny Discord & group chat messages",
    title: "Funny Discord Messages & Group Chat Phrases",
    intro: "Pings, VC invites, left-on-read moments and server drama, phrased as if the group chat were a medieval guild.",
    describe: (count) =>
      `${count} funny Discord messages and group chat phrases for pings, voice chat, DMs and dead servers, each rewritten with unnecessary ceremony. Copy one in a click.`,
    more: "funny Discord and group chat messages",
    related: ["afk", "twitch", "internet"],
    featuredPhraseId: "left-on-read",
  },
  afk: {
    slug: "afk-social",
    navLabel: "BRB & goodbyes",
    heading: "Funny ways to say BRB, goodbye & goodnight",
    title: "Funny Ways to Say BRB, Goodbye & Goodnight",
    intro: "Leaving, returning, apologising and saying goodnight: everyday chat messages, made considerably more ceremonious.",
    describe: (count) =>
      `${count} funny ways to say BRB, goodbye, goodnight, welcome back and sorry in chat, each rewritten as an elaborate courtly announcement. Copy one before you log off.`,
    more: "funny ways to say BRB, goodbye and goodnight",
    related: ["discord", "internet", "gaming"],
    featuredPhraseId: "brb",
  },
};

export const homeSeo = {
  title: `${siteName} | Funny Gaming, Twitch & Discord Phrases`,
  socialTitle: `${siteName}: funny gaming, Twitch & Discord phrases`,
  description: `${phrases.length} funny gaming, Twitch, Discord and internet phrases, comebacks and replies, translated with unnecessary dignity. Click any phrase to copy it.`,
};

export function categoryPath(id: CategoryId): string {
  return `/${categorySeo[id].slug}`;
}

export function phrasePath(id: string): string {
  return `/p/${id}`;
}

export function categoryBySlug(slug: string): CategoryId | undefined {
  return categories.find(({ id }) => categorySeo[id].slug === slug)?.id;
}

export function phrasesInCategory(id: CategoryId): Phrase[] {
  return phrases.filter((phrase) => phrase.category === id);
}

export function categoryMetadata(id: CategoryId) {
  const seo = categorySeo[id];
  return { title: seo.title, description: seo.describe(phrasesInCategory(id).length), path: categoryPath(id) };
}

// Hand-picked titles where people search for the everyday wording rather than the slang alone.
// Plural "ways" only where the page's kindred phrases really are alternatives.
const phraseTitles: Record<string, string> = {
  "skill-issue": "Funny Ways to Say “Skill Issue”",
  gg: "Funny Way to Say “GG”",
  cooked: "Funny Ways to Say Someone Is “Cooked”",
  "bro-is-cooked": "Funny Way to Say “Bro Is Cooked”",
  "mods-alert": "Funny Way to Call the Mods: “MODS!”",
  "mods-question": "Funny Way to Ask for the Mods: “Mods?”",
  bro: "Funny Way to Say “Bro”",
  brb: "Funny Ways to Say “BRB”",
  gtg: "Funny Way to Say You Have to Go: “GTG”",
  goodnight: "Funny Way to Say “Goodnight”",
  "see-ya": "Funny Way to Say Goodbye: “See Ya”",
  "im-back": "Funny Way to Say “I'm Back”",
};

const ledeOverrides: Record<string, string> = {
  "mods-alert": "A ridiculous Twitch-chat way to summon the mods.",
  "mods-question": "An overly formal way to ask whether any mods are watching.",
  cooked: "A funnier way to say someone is cooked.",
  gtg: "A funnier way to say you have to go.",
  "see-ya": "A funnier way to say goodbye.",
};

function defaultTitle(phrase: Phrase): string {
  const quoted = `“${phrase.slang}”`;
  switch (phrase.category) {
    case "gaming":
      return `Funny Way to Say ${quoted} in Game Chat`;
    case "twitch":
      return `Funny Twitch Chat Phrase: ${quoted}`;
    case "discord":
      return `Funny Discord Message: ${quoted}`;
    case "arguments":
      return `Funny Comeback: ${quoted}`;
    case "reactions":
      return `Funny Reaction: ${quoted}`;
    case "afk":
      return `Funny Way to Say ${quoted} in Chat`;
    default:
      return `Funny Way to Say ${quoted}`;
  }
}

function defaultLede(phrase: Phrase): string {
  const quoted = `“${phrase.slang}”`;
  const roast = phrase.intents?.includes("roast");
  switch (phrase.category) {
    case "gaming":
      return roast ? `Looking for a funnier way to say ${quoted}?` : `A funnier way to say ${quoted} in game chat.`;
    case "twitch":
      return `A ridiculous way to say ${quoted} in Twitch chat.`;
    case "discord":
      return `An unnecessarily formal way to say ${quoted} in Discord or the group chat.`;
    case "arguments":
      return `A more dignified way to say ${quoted} in an argument.`;
    case "reactions":
      return `A more dramatic way to say ${quoted} when someone deserves it.`;
    case "afk":
      return `A more ceremonious way to say ${quoted} in chat.`;
    default:
      return roast ? `A funnier way to say ${quoted} online.` : `${quoted}, given far more dignity than it deserves.`;
  }
}

/** Drops doubled sentence punctuation where a quote already ends one: “Who asked?”. */
function tidy(text: string): string {
  return text.replace(/([?!.])”([?!.])/g, "$1”");
}

/** Title, one visible sentence and meta description for a phrase page. */
export function phraseSeo(phrase: Phrase) {
  const lede = tidy(ledeOverrides[phrase.id] ?? defaultLede(phrase));
  return {
    title: phraseTitles[phrase.id] ?? defaultTitle(phrase),
    lede,
    description: tidy(`${lede} Copy “${phrase.translation}” and browse more ${categorySeo[phrase.category].more}.`),
  };
}

/**
 * Canonical, Open Graph and Twitter fields for one page. Next replaces rather
 * than merges nested metadata objects, so every page gets the full set.
 */
export function pageMetadata({
  title,
  socialTitle = title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  socialTitle?: string;
  description: string;
  path: string;
  /** Skip the "| Ye Olde Chat" title template (the home page already leads with the name). */
  absoluteTitle?: boolean;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName, locale: "en", title: socialTitle, description },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}

export function absoluteUrl(base: string, path: string): string {
  return path === "/" ? base : `${base}${path}`;
}

export function buildSitemap(base: string): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl(base, "/") },
    ...categories.map(({ id }) => ({ url: absoluteUrl(base, categoryPath(id)) })),
    ...phrases.map(({ id }) => ({ url: absoluteUrl(base, phrasePath(id)) })),
  ];
}

export function buildRobots(base: string): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: absoluteUrl(base, "/sitemap.xml"),
  };
}

type Crumb = { name: string; path: string };

export function categoryBreadcrumbs(id: CategoryId): Crumb[] {
  return [
    { name: siteName, path: "/" },
    { name: categoryLabels[id], path: categoryPath(id) },
  ];
}

export function phraseBreadcrumbs(phrase: Phrase): Crumb[] {
  return [...categoryBreadcrumbs(phrase.category), { name: phrase.slang, path: phrasePath(phrase.id) }];
}

function breadcrumbList(base: string, crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(base, crumb.path),
    })),
  };
}

export function websiteJsonLd(base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: absoluteUrl(base, "/"),
    description: homeSeo.description,
    inLanguage: "en",
  };
}

export function categoryJsonLd(base: string, id: CategoryId) {
  const { title, description, path } = categoryMetadata(id);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: absoluteUrl(base, path),
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl(base, "/") },
    breadcrumb: breadcrumbList(base, categoryBreadcrumbs(id)),
  };
}

export function phraseJsonLd(base: string, phrase: Phrase) {
  return { "@context": "https://schema.org", ...breadcrumbList(base, phraseBreadcrumbs(phrase)) };
}

/** Serializes JSON-LD for a script tag without letting content close the tag early. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
