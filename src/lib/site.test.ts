import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeSiteUrl, resolveSiteUrl } from "./site.ts";

describe("site URL resolution", () => {
  it("uses an explicit URL first and removes unnecessary trailing slashes", () => {
    assert.equal(
      resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://example.com/phrasebook///" }),
      "https://example.com/phrasebook",
    );
  });

  it("uses Vercel's production domain when explicitly exposed", () => {
    assert.equal(resolveSiteUrl({ NODE_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "yeoldechat.example" }), "https://yeoldechat.example");
  });

  it("uses localhost only during development", () => {
    assert.equal(resolveSiteUrl({ NODE_ENV: "development" }), "http://localhost:3000");
  });

  it("rejects malformed URLs and a production build without a legitimate URL", () => {
    assert.throws(() => normalizeSiteUrl("example.com"), /well-formed/);
    assert.throws(() => normalizeSiteUrl("https://https://example.com"), /well-formed/);
    assert.throws(() => normalizeSiteUrl("ftp://example.com"), /http/);
    assert.throws(() => resolveSiteUrl({ NODE_ENV: "production" }), /Missing production site URL/);
  });
});
