import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { phrases, type Phrase } from "./phrases.ts";
import { filterPhrases, normalize, searchPhrases, type CategoryFilter } from "./search.ts";

const sample: Phrase[] = [
  { id: "gg", category: "gaming", slang: "GG", translation: "A worthy contest, well fought.", aliases: ["good game"], tags: ["praise"] },
  { id: "w", category: "internet", slang: "W", translation: "A glorious triumph!", aliases: ["win"], tags: ["win"] },
  { id: "spam-w", category: "twitch", slang: "Spam W", translation: "Flood the halls with symbols of triumph!", tags: ["win"] },
  { id: "were-cooked", category: "internet", slang: "We're cooked", translation: "Alas, our fate hath already been sealed.", tags: ["doom"] },
  { id: "chat-is-this-real", category: "twitch", slang: "Chat, is this real?", translation: "Good people, doth mine eyes deceive me?", tags: ["shock"] },
];

const ids = (list: readonly Phrase[]) => list.map((phrase) => phrase.id);
const search = (query: string, category: CategoryFilter = "all") => ids(filterPhrases(phrases, { query, category }));
const top = (query: string, count = 1) => search(query).slice(0, count);

describe("normalize", () => {
  it("trims, lowercases and collapses whitespace", () => {
    assert.equal(normalize("  Skill   ISSUE \n"), "skill issue");
  });

  it("drops apostrophes and treats other punctuation as spaces", () => {
    assert.equal(normalize("We’re cooked"), "were cooked");
    assert.equal(normalize("Chat, is this real?!"), "chat is this real");
    assert.equal(normalize("Pog / PogChamp"), "pog pogchamp");
  });

  it("ignores accents", () => {
    assert.equal(normalize("Café"), "cafe");
  });
});

describe("filterPhrases on a small sample", () => {
  it("returns everything in original order for a blank query", () => {
    assert.deepEqual(ids(filterPhrases(sample, { query: "   ", category: "all" })), ids(sample));
  });

  it("filters by category", () => {
    assert.deepEqual(ids(filterPhrases(sample, { query: "", category: "twitch" })), ["spam-w", "chat-is-this-real"]);
  });

  it("combines category and query", () => {
    assert.deepEqual(ids(filterPhrases(sample, { query: "w", category: "twitch" })), ["spam-w"]);
  });

  it("matches slang regardless of case, whitespace and punctuation", () => {
    assert.deepEqual(ids(filterPhrases(sample, { query: "  WERE COOKED ", category: "all" })), ["were-cooked"]);
    assert.deepEqual(ids(filterPhrases(sample, { query: "chat is this real", category: "all" })), ["chat-is-this-real"]);
  });

  it("matches translations and aliases", () => {
    assert.deepEqual(ids(filterPhrases(sample, { query: "deceive", category: "all" })), ["chat-is-this-real"]);
    assert.deepEqual(ids(filterPhrases(sample, { query: "good game", category: "all" })), ["gg"]);
  });

  it("ranks exact slang, then slang prefixes, then words inside slang", () => {
    assert.deepEqual(ids(filterPhrases(sample, { query: "w", category: "all" })), ["w", "were-cooked", "spam-w"]);
  });

  it("returns nothing when no phrase matches", () => {
    assert.deepEqual(filterPhrases(sample, { query: "zzz", category: "all" }), []);
  });
});

describe("searching the corpus", () => {
  it("keeps exact slang dominant for one- and two-letter phrases", () => {
    assert.deepEqual(top("L"), ["l"]);
    assert.deepEqual(top("w"), ["w"]);
    assert.deepEqual(top("GG", 2), ["gg", "gg-wp"]);
    assert.deepEqual(top("gg wp"), ["gg-wp"]);
    // Phrases that merely contain the letter follow the phrase itself.
    assert.ok(search("L").includes("l-chat") && search("L").indexOf("l-chat") > 0);
  });

  it("finds aliases as if they were slang", () => {
    assert.deepEqual(top("PogChamp"), ["pog"]);
    assert.deepEqual(top("bffr"), ["be-so-for-real"]);
    assert.deepEqual(top("hop in vc"), ["join-vc"]);
    assert.deepEqual(top("cya"), ["see-ya"]);
  });

  it("keeps Mods? and MODS! as separate top results", () => {
    assert.deepEqual(top("mods", 2).sort(), ["mods-alert", "mods-question"]);
  });

  it("normalizes punctuation, apostrophes and contractions", () => {
    assert.deepEqual(top("were cooked"), ["were-cooked"]);
    assert.deepEqual(top("we are cooked"), ["were-cooked"]);
    assert.deepEqual(top("We’re COOKED!!"), ["were-cooked"]);
    assert.deepEqual(top("we are so back"), ["we-are-so-back"]);
    assert.deepEqual(top("chat is this real"), ["chat-is-this-real"]);
    assert.deepEqual(top("source trust me bro"), ["source-trust-me-bro"]);
  });

  it("tolerates obvious typos and missing spaces", () => {
    assert.deepEqual(top("pogchmp"), ["pog"]);
    assert.deepEqual(top("residentsleeper"), ["residentsleeper"]);
    assert.deepEqual(top("resident sleeper"), ["residentsleeper"]);
    assert.deepEqual(top("residentslep"), ["residentsleeper"]);
    assert.deepEqual(top("skill issur"), ["skill-issue"]);
    assert.deepEqual(top("rubberbandng"), ["rubberbanding"]);
  });

  it("does not treat known words as typos of unrelated slang", () => {
    assert.ok(!search("roast").includes("toaster-pc"));
    assert.ok(!search("someone won't stop talking").includes("tank-diff"));
  });

  it("finds phrases by situation", () => {
    assert.ok(top("my teammate is terrible", 8).includes("team-diff"));
    assert.deepEqual(top("someone won't stop talking", 3).sort(), ["shut-up", "yapper", "yapping"]);
    assert.deepEqual(top("this guy needs banning"), ["ban-him"]);
    assert.deepEqual(top("the stream is broken", 2).sort(), ["stream-froze", "stream-is-scuffed"]);
    assert.deepEqual(top("he missed every shot", 2).sort(), ["aim-diff", "whiff"]);
    assert.deepEqual(top("someone is lying"), ["cap"]);
    assert.deepEqual(top("I need to leave"), ["gtg"]);
    assert.ok(top("that was amazing", 12).includes("clutch"));
  });

  it("matches tags and intent words", () => {
    const ranked = filterPhrases(phrases, { query: "ranked", category: "all" });
    assert.ok(ranked.length > 0 && ranked.every((phrase) => phrase.tags.includes("ranked")));
    const roasts = filterPhrases(phrases, { query: "roast", category: "all" });
    assert.ok(roasts.length > 20 && roasts.every((phrase) => phrase.intents?.includes("roast")));
  });

  it("does not mistake coincidental shared words for relevance", () => {
    // "good" is praise here, not the "good" of "Get good".
    assert.notEqual(top("that was so good")[0], "get-good");
    assert.ok(!top("that was so good", 5).some((id) => ["get-good", "you-suck", "noob", "ez"].includes(id)));
    assert.ok(!["get-good", "call-me"].includes(top("good call")[0]));
    assert.ok(!search("that was amazing").includes("op"));
    assert.ok(!search("how's it going").some((id) => ["gtg", "see-ya", "later", "log-off", "im-out"].includes(id)));
    assert.equal(top("won't stop talking")[0] === "cant-talk", false);
  });

  it("no longer matches removed aliases", () => {
    assert.deepEqual(search("bruh"), []);
    assert.equal(top("fr")[0], "fr");
    // Friend request may still appear for "fr" as a slang prefix, but never as an exact alias match.
    const friendRequest = searchPhrases(phrases, { query: "fr request", category: "all" }).find(({ phrase }) => phrase.id === "friend-request");
    assert.ok(!friendRequest || friendRequest.score < 900);
    const fr = searchPhrases(phrases, { query: "fr", category: "all" });
    assert.ok(fr.findIndex(({ phrase }) => phrase.id === "friend-request") > fr.findIndex(({ phrase }) => phrase.id === "fr"));
    assert.equal(top("your mic")[0] === "mic-muted" && searchPhrases(phrases, { query: "your mic", category: "all" })[0].score >= 900, false);
  });

  it("finds words of the translation", () => {
    assert.ok(search("dissertation").includes("bro-wrote-an-essay"));
  });

  it("respects the category filter for fuzzy and situational queries", () => {
    assert.ok(search("he missed every shot", "twitch").every((id) => phrases.find((phrase) => phrase.id === id)?.category === "twitch"));
    assert.deepEqual(search("skill issur", "discord"), []);
  });

  it("is deterministic and returns each phrase at most once", () => {
    for (const query of ["l", "cooked", "my teammate is terrible", "pogchmp"]) {
      const first = searchPhrases(phrases, { query, category: "all" });
      assert.deepEqual(searchPhrases(phrases, { query, category: "all" }), first);
      assert.equal(new Set(first.map(({ phrase }) => phrase.id)).size, first.length);
    }
  });

  it("stays fast across the whole corpus", () => {
    const started = performance.now();
    for (let i = 0; i < 20; i++) searchPhrases(phrases, { query: "my teammate keeps missing every shot", category: "all" });
    assert.ok((performance.now() - started) / 20 < 25, "a search should take well under a frame");
  });
});
