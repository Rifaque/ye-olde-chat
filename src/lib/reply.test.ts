import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { replyIntents } from "./concepts.ts";
import { getPhrase, phrases } from "./phrases.ts";
import { relatedPhrases } from "./related.ts";
import { findReplies } from "./reply.ts";

const replyIds = (message: string, options?: Parameters<typeof findReplies>[2]) =>
  findReplies(phrases, message, options).map(({ phrase }) => phrase.id);

describe("findReplies", () => {
  it("answers a missed shot with aim taunts", () => {
    assert.deepEqual(replyIds("bro you literally missed every shot").slice(0, 3).sort(), ["aim-diff", "skill-issue", "whiff"]);
  });

  it("answers endless talking with yapping phrases", () => {
    const top = replyIds("why are you still talking").slice(0, 4);
    for (const id of ["yapping", "yapper", "bro-wrote-an-essay"]) assert.ok(top.includes(id), `${id} missing from ${top}`);
  });

  it("answers a ban request with the wardens", () => {
    assert.deepEqual(replyIds("this guy needs to be banned").slice(0, 3), ["ban-him", "mods-alert", "permaban"]);
  });

  it("matches message words after normalization", () => {
    assert.deepEqual(replyIds("THIS GUY NEEDS TO BE BANNED!!!").slice(0, 3), replyIds("this guy needs to be banned").slice(0, 3));
    assert.equal(replyIds("i'm back")[0], "welcome-back");
    assert.equal(replyIds("gg")[0], "gg");
    assert.ok(replyIds("my team is so bad").slice(0, 3).includes("team-diff"));
  });

  it("answers praise with praise, not with roasts that merely share a word", () => {
    for (const message of ["that was so good", "good call"]) {
      const top = findReplies(phrases, message).slice(0, 5);
      assert.ok(top.length > 0, `no replies for "${message}"`);
      assert.ok(top.every(({ phrase }) => phrase.intents?.includes("praise")), `${message}: ${top.map(({ phrase }) => phrase.id)}`);
      assert.ok(!top.some(({ phrase }) => ["get-good", "call-me"].includes(phrase.id)));
    }
    assert.deepEqual(replyIds("how's it going"), []);
    assert.deepEqual(replyIds("bruh"), []);
  });

  it("narrows to the chosen kind of reply", () => {
    for (const { id } of replyIntents) {
      for (const phrase of findReplies(phrases, "bro you literally missed every shot, you are so bad", { intent: id })) {
        assert.ok(phrase.phrase.intents?.includes(id), `${phrase.phrase.id} is not a ${id} reply`);
      }
    }
    assert.deepEqual(replyIds("that was amazing", { intent: "praise" }).length > 0, true);
    assert.deepEqual(replyIds("this guy needs to be banned", { intent: "roast" }), []);
  });

  it("is deterministic", () => {
    const message = "why does my team keep throwing every game";
    assert.deepEqual(findReplies(phrases, message), findReplies(phrases, message));
  });

  it("only ever returns untouched phrases from the corpus", () => {
    for (const message of ["bro you literally missed every shot", "why are you still talking", "lol", "sorry my bad"]) {
      const results = findReplies(phrases, message);
      assert.ok(results.length > 0);
      for (const { phrase } of results) {
        assert.equal(getPhrase(phrase.id), phrase, "result must be the canonical phrase object");
        assert.ok(phrases.includes(phrase));
      }
    }
  });

  it("returns nothing for blank or unrelated messages, and respects the limit", () => {
    assert.deepEqual(findReplies(phrases, "   "), []);
    assert.deepEqual(findReplies(phrases, "the of and"), []);
    assert.ok(findReplies(phrases, "that was amazing", { limit: 3 }).length <= 3);
    assert.doesNotThrow(() => findReplies(phrases, "talking ".repeat(5000)));
  });
});

describe("relatedPhrases", () => {
  it("suggests kindred phrases without the phrase itself", () => {
    const skillIssue = getPhrase("skill-issue")!;
    const related = relatedPhrases(phrases, skillIssue).map((phrase) => phrase.id);
    assert.equal(related.length, 4);
    assert.ok(!related.includes("skill-issue"));
    assert.ok(related.includes("skill-diff"));
    assert.ok(related.includes("aim-diff") || related.includes("whiff"));
    assert.deepEqual(relatedPhrases(phrases, skillIssue), relatedPhrases(phrases, skillIssue));
  });

  it("keeps Mods? close to MODS!", () => {
    assert.ok(relatedPhrases(phrases, getPhrase("mods-alert")!).some((phrase) => phrase.id === "mods-question"));
  });
});
