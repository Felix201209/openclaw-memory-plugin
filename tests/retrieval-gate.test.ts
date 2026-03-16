import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRetrievalQuery, shouldSkipAutoRetrieval } from "../src/memory/retrievalGate.js";

test("skips auto retrieval for command-like prompts and metadata wrappers", () => {
  const normalized = normalizeRetrievalQuery(`[cron:nightly sync] run import repair`);
  assert.equal(normalized, "run import repair");
  assert.equal(shouldSkipAutoRetrieval(`[cron:nightly sync] run import repair`), true);
});

test("forces retrieval for short recall-intent prompts", () => {
  assert.equal(shouldSkipAutoRetrieval("你记得吗？"), false);
  assert.equal(shouldSkipAutoRetrieval("remember my preferences?"), false);
});
