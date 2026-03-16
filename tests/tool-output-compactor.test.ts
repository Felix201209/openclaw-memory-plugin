import test from "node:test";
import assert from "node:assert/strict";
import { ToolOutputCompactor } from "../src/compression/ToolOutputCompactor.js";

test("keeps short tool payloads lightweight", () => {
  const compactor = new ToolOutputCompactor(100);
  const result = compactor.compact("read", "short content");
  assert.match(result.compacted, /Summary:/);
  assert.ok((result.savedTokens ?? 0) >= 0);
});

test("compresses large tool payloads and reports token savings", () => {
  const compactor = new ToolOutputCompactor(40);
  const payload = "README section\n".repeat(80);
  const result = compactor.compact("read", payload);
  assert.match(result.compacted, /Tool: read/);
  assert.ok((result.savedTokens ?? 0) > 0);
});

test("preserves structural clues like commands, code, and error stacks in compacted output", () => {
  const compactor = new ToolOutputCompactor(40);
  const payload = [
    "$ npm run build",
    "",
    "Error: build failed",
    "    at compile (src/build.ts:10:2)",
    "    at main (src/index.ts:5:1)",
    "",
    "```ts",
    "export function build() {",
    "  return compileProject();",
    "}",
    "```",
  ].join("\n");
  const result = compactor.compact("run", payload);
  assert.match(result.compacted, /Command:/);
  assert.match(result.compacted, /Error:/);
  assert.match(result.compacted, /Code:/);
});
