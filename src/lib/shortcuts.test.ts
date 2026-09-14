import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getKeyboardShortcutAction } from "./shortcuts.ts";

const base = {
  key: "Escape",
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  isTextEntry: false,
  isSearchInput: false,
  randomActive: false,
  query: "",
};

describe("phrasebook keyboard shortcuts", () => {
  it("clears an active search from a phrase card or category filter", () => {
    assert.equal(getKeyboardShortcutAction({ ...base, query: "W" }), "clear-search");
    assert.equal(getKeyboardShortcutAction({ ...base, query: "W", isTextEntry: false }), "clear-search");
  });

  it("exits Random before clearing search, including from the search input", () => {
    assert.equal(getKeyboardShortcutAction({ ...base, randomActive: true, isSearchInput: true, isTextEntry: true }), "exit-random");
    assert.equal(getKeyboardShortcutAction({ ...base, randomActive: true }), "exit-random");
    assert.equal(getKeyboardShortcutAction({ ...base, randomActive: true, query: "W" }), "exit-random");
  });

  it("does nothing on a repeated Escape or in an unrelated text editor", () => {
    assert.equal(getKeyboardShortcutAction(base), "none");
    assert.equal(getKeyboardShortcutAction({ ...base, isTextEntry: true }), "none");
  });

  it("keeps search shortcuts available without stealing ordinary typing", () => {
    assert.equal(getKeyboardShortcutAction({ ...base, key: "/" }), "focus-search");
    assert.equal(getKeyboardShortcutAction({ ...base, key: "/", isTextEntry: true, isSearchInput: true }), "none");
    assert.equal(getKeyboardShortcutAction({ ...base, key: "k", ctrlKey: true, isTextEntry: true }), "focus-search");
    assert.equal(getKeyboardShortcutAction({ ...base, key: "k", metaKey: true }), "focus-search");
  });
});
