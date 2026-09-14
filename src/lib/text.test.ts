import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonical, containsRun, editDistance, stem } from "./text.ts";

describe("text helpers", () => {
  it("folds spelled-out and apostrophe-free contractions together", () => {
    assert.equal(canonical("We are so back"), "were so back");
    assert.equal(canonical("we're so back"), "were so back");
    assert.equal(canonical("I am out"), canonical("I'm out"));
    assert.equal(canonical("u mad"), "you mad");
    assert.equal(canonical("can not talk"), canonical("can't talk"));
  });

  it("stems consistently enough to match word forms", () => {
    assert.equal(stem("banning"), stem("banned"));
    assert.equal(stem("banned"), stem("ban"));
    assert.equal(stem("missed"), stem("miss"));
    assert.equal(stem("teammates"), stem("teammate"));
    assert.equal(stem("leaving"), stem("leave"));
    assert.equal(stem("talking"), stem("talk"));
  });

  it("measures typos including transpositions, with an early cut-off", () => {
    assert.equal(editDistance("skill issue", "skill issur", 2), 1);
    assert.equal(editDistance("pogchmp", "pogchamp", 1), 1);
    assert.equal(editDistance("whiff", "wihff", 1), 1);
    assert.equal(editDistance("abc", "xyzuvw", 1), 2);
  });

  it("finds consecutive runs", () => {
    assert.equal(containsRun(["this", "guy", "needs", "to", "be", "banned"], ["to", "be", "banned"]), true);
    assert.equal(containsRun(["to", "banned", "be"], ["to", "be"]), false);
    assert.equal(containsRun(["a"], []), false);
  });
});
