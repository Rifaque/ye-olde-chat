import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reportCopy } from "./stats-client.ts";

describe("reportCopy", () => {
  it("posts only the phrase id", async () => {
    let sent: { url: string; init: RequestInit } | undefined;
    const fakeFetch = (async (url: string, init: RequestInit) => {
      sent = { url, init };
      return new Response("{}");
    }) as unknown as typeof fetch;
    await reportCopy("skill-issue", fakeFetch);
    assert.equal(sent?.url, "/api/copy");
    assert.equal(sent?.init.method, "POST");
    assert.equal(sent?.init.body, JSON.stringify({ phraseId: "skill-issue" }));
  });

  it("never rejects, so a stats failure cannot disturb a successful copy", async () => {
    const rejecting = (async () => Promise.reject(new TypeError("offline"))) as unknown as typeof fetch;
    const throwing = (() => {
      throw new Error("fetch missing");
    }) as unknown as typeof fetch;
    const limited = (async () => new Response("{}", { status: 429 })) as unknown as typeof fetch;
    await assert.doesNotReject(reportCopy("gg", rejecting));
    await assert.doesNotReject(reportCopy("gg", throwing));
    await assert.doesNotReject(reportCopy("gg", limited));
  });
});
