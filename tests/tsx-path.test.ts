import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resolveTsxCommand } from "./helpers/tsx-path.js";

test("resolveTsxCommand prefers tsx.cmd on Windows", () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-recall-tsx-"));
  const binDir = path.join(repoRoot, "node_modules", ".bin");
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(path.join(binDir, "tsx.cmd"), "@echo off\r\n");

  const resolved = resolveTsxCommand(repoRoot, "win32");

  assert.equal(resolved.command, path.join(binDir, "tsx.cmd"));
  assert.deepEqual(resolved.argsPrefix, []);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});
