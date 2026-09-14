import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { copyText, copyWithTextarea, type CopyEnvironment } from "./clipboard.ts";

function environment(overrides: Partial<CopyEnvironment> = {}): CopyEnvironment {
  return {
    isSecureContext: true,
    writeText: async () => {},
    fallback: () => true,
    setTimer: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimer: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
    ...overrides,
  };
}

describe("copyText", () => {
  it("returns copied for a native Clipboard API success", async () => {
    let fallbackCalled = false;
    const result = await copyText("phrase", environment({ fallback: () => (fallbackCalled = true) }));
    assert.equal(result, "copied");
    assert.equal(fallbackCalled, false);
  });

  it("uses the fallback after a native rejection", async () => {
    const rejected = async () => Promise.reject(new Error("denied"));
    assert.equal(await copyText("phrase", environment({ writeText: rejected, fallback: () => true })), "copied");
    assert.equal(await copyText("phrase", environment({ writeText: rejected, fallback: () => false })), "unavailable");
  });

  it("never returns a definitive failure after a native timeout", async () => {
    let fallbackCalled = false;
    const never = () => new Promise<void>(() => {});
    const result = await copyText("phrase", environment({ writeText: never, fallback: () => (fallbackCalled = true), timeoutMs: 1 }));
    assert.equal(result, "uncertain");
    assert.equal(fallbackCalled, false);
  });
});

it("fallback copy removes its helper and restores focus and selection", () => {
  let appended = false;
  let removed = false;
  let focused = false;
  let restoredControlSelection: unknown;
  let selectionCleared = false;
  const restoredRanges: unknown[] = [];
  const range = { cloneRange: () => "saved-range" };
  const selection = {
    rangeCount: 1,
    getRangeAt: () => range,
    removeAllRanges: () => { selectionCleared = true; },
    addRange: (value: unknown) => restoredRanges.push(value),
  };
  const previousFocus = {
    selectionStart: 2,
    selectionEnd: 5,
    selectionDirection: "forward" as const,
    focus: (options: unknown) => { focused = Boolean((options as { preventScroll?: boolean }).preventScroll); },
    setSelectionRange: (...args: unknown[]) => { restoredControlSelection = args; },
  };
  const attributes = new Map<string, string>();
  const textarea = {
    value: "",
    readOnly: false,
    tabIndex: 0,
    style: {},
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    select: () => {},
    setSelectionRange: () => {},
    remove: () => { removed = true; },
  };
  const documentRef = {
    activeElement: previousFocus,
    getSelection: () => selection,
    createElement: () => textarea,
    body: { append: () => { appended = true; } },
    execCommand: () => true,
  };

  assert.equal(copyWithTextarea("phrase", documentRef as unknown as Document), true);
  assert.equal(appended, true);
  assert.equal(removed, true);
  assert.equal(focused, true);
  assert.deepEqual(restoredControlSelection, [2, 5, "forward"]);
  assert.equal(selectionCleared, true);
  assert.deepEqual(restoredRanges, ["saved-range"]);
  assert.equal(attributes.has("aria-hidden"), false);
});
