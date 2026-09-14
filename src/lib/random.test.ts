import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickRandom } from "./random.ts";

const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("pickRandom", () => {
  it("picks exactly one item from the pool", () => {
    assert.deepEqual(pickRandom(pool, null, () => 0), { id: "a" });
    assert.deepEqual(pickRandom(pool, null, () => 0.5), { id: "b" });
    assert.deepEqual(pickRandom(pool, null, () => 0.9999), { id: "c" });
  });

  it("never repeats the previous pick when there is an alternative", () => {
    for (const value of [0, 0.25, 0.5, 0.75, 0.9999]) {
      assert.notEqual(pickRandom(pool, "a", () => value)?.id, "a");
    }
    // Over many real random draws, too.
    for (let i = 0; i < 200; i++) {
      assert.notEqual(pickRandom(pool, "b")?.id, "b");
    }
  });

  it("returns the only item even if it was picked last time", () => {
    assert.deepEqual(pickRandom([{ id: "solo" }], "solo"), { id: "solo" });
  });

  it("stays in bounds if the random source returns 1", () => {
    assert.deepEqual(pickRandom(pool, null, () => 1), { id: "c" });
  });

  it("returns undefined for an empty pool", () => {
    assert.equal(pickRandom([], null), undefined);
  });
});
