import assert from "node:assert/strict";
import test from "node:test";
import { tokenize } from "../src/shared/text.js";

test("tokenize omits single-character CJK tokens", () => {
  const tokens = tokenize("我喜欢中文");
  assert.ok(!tokens.includes("我"));
  assert.ok(tokens.includes("我喜"));
  assert.ok(tokens.includes("喜欢"));
  assert.ok(tokens.includes("中文"));
});

test("tokenize keeps two-character CJK phrases searchable", () => {
  assert.deepEqual(tokenize("中文"), ["中文"]);
});
