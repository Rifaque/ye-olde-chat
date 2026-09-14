import assert from "node:assert/strict";
import { it } from "node:test";
import { toRoman } from "./roman.ts";

it("writes years in Roman numerals", () => {
  assert.equal(toRoman(2026), "MMXXVI");
  assert.equal(toRoman(1999), "MCMXCIX");
  assert.equal(toRoman(4), "IV");
  assert.throws(() => toRoman(0), RangeError);
});
