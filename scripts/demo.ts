import { execFileSync } from "node:child_process";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const output = execFileSync("npm", ["run", "test:integration", "--silent"], {
  cwd: repoRoot,
  encoding: "utf8",
});

const lines = output.trim().split(/\r?\n/);
const jsonStart = lines.findIndex((line) => line.trim().startsWith("{"));
const payload = JSON.parse(lines.slice(jsonStart).join("\n")) as {
  recallReply: string;
  toolReply: string;
  memoryCount: number;
  profileCount: number;
  toolCompactions: number;
};

process.stdout.write(
  [
    "OpenClaw Recall demo",
    "",
    "1. User teaches a stable preference:",
    "   以后默认叫我 Felix，用中文回答，并且尽量简洁。",
    "",
    "2. New session asks for recall:",
    `   ${payload.recallReply}`,
    "",
    "3. Tool output is compacted instead of replayed in full:",
    `   ${payload.toolReply}`,
    "",
    "4. Recorded artifacts:",
    `   memories=${payload.memoryCount}`,
    `   profiles=${payload.profileCount}`,
    `   compactedToolResults=${payload.toolCompactions}`,
    "",
    "This demo shows automatic memory write, cross-session retrieval, and tool compaction with profile recording.",
  ].join("\n"),
);
