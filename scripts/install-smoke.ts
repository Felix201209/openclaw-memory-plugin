import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { installOpenAiResponsesMock } from "../src/testing/mockOpenAIResponses.js";
import { resolvePluginConfig } from "../src/config/loader.js";
import { getOrCreatePluginContainer } from "../src/plugin/runtime-state.js";

type EmbeddedRunResult = {
  payloads?: Array<{ text?: string }>;
};

type OpenClawExtensionApi = {
  runEmbeddedPiAgent: (params: Record<string, unknown>) => Promise<EmbeddedRunResult>;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testRoot = path.join(repoRoot, ".openclaw-install-test");
const openclawHome = path.join(testRoot, "openclaw-home");
const workspaceDir = path.join(testRoot, "workspace");
const agentDir = path.join(testRoot, "agent");
const sessionDir = path.join(testRoot, "sessions");
const configDir = path.join(openclawHome, ".openclaw");
const configPath = path.join(configDir, "openclaw.json");

await fs.rm(testRoot, { recursive: true, force: true });
await fs.mkdir(workspaceDir, { recursive: true });
await fs.mkdir(agentDir, { recursive: true });
await fs.mkdir(sessionDir, { recursive: true });
await fs.writeFile(
  path.join(workspaceDir, "README.md"),
  [
    "# Install Smoke Workspace",
    "",
    "This README is intentionally long so tool output compaction has visible savings.",
    "",
    "OpenClaw Recall should remember user preferences, compress old context, compact tool output, and record profiles.",
    "The smoke test reads this file so the plugin stores a compact summary instead of replaying raw content.",
    "Repeated concepts: memory recall, context budgeting, tool compaction, profile inspection, session continuity.",
  ].join("\n"),
  "utf8",
);
await fs.writeFile(path.join(agentDir, "AGENTS.md"), "# Agent\nUse concise Chinese replies.\n", "utf8");

runOpenClaw(["plugins", "install", "--link", repoRoot], openclawHome);
runOpenClaw(["plugins", "info", "openclaw-recall"], openclawHome);

process.env.OPENCLAW_HOME = openclawHome;
process.env.OPENCLAW_RUNNER_LOG = "0";

const installedConfig = JSON.parse(await fs.readFile(configPath, "utf8")) as Record<string, unknown>;
const mock = installOpenAiResponsesMock();
const api = await importOpenClaw();

try {
  const common = {
    workspaceDir,
    agentDir,
    config: withModelConfig(installedConfig),
    provider: "openai",
    model: "gpt-4.1-mini",
    timeoutMs: 10_000,
    trigger: "user",
    messageChannel: "cli",
  };

  await run(api, {
    ...common,
    sessionId: "install-smoke-1",
    sessionKey: "plugin:install:1",
    runId: "plugin-install-run-1",
    sessionFile: path.join(sessionDir, "install-smoke-1.jsonl"),
    prompt: "以后默认叫我 Felix，用中文回答，并且尽量简洁。",
  });

  const recall = await run(api, {
    ...common,
    sessionId: "install-smoke-2",
    sessionKey: "plugin:install:2",
    runId: "plugin-install-run-2",
    sessionFile: path.join(sessionDir, "install-smoke-2.jsonl"),
    prompt: "你记得我的偏好吗？",
  });

  await run(api, {
    ...common,
    sessionId: "install-smoke-3",
    sessionKey: "plugin:install:3",
    runId: "plugin-install-run-3",
    sessionFile: path.join(sessionDir, "install-smoke-3.jsonl"),
    prompt: 'read "README.md"',
  });

  const container = getOrCreatePluginContainer({
    config: resolvePluginConfig({
      env: {
        ...process.env,
        OPENCLAW_HOME: openclawHome,
      },
    }),
    logger: silentLogger(),
  });

  const memories = await container.memoryStore.listActive();
  const profiles = await container.profileStore.list(10);
  const latestProfile = profiles[0] ?? null;
  const toolResults = await container.toolOutputStore.listSession("install-smoke-3", 10);

  assert(memories.length >= 2, "expected installed plugin to write memories");
  assert(profiles.length >= 2, "expected installed plugin to record profiles");
  assert.equal(latestProfile?.promptTokensSource, "exact", "expected provider usage to produce exact prompt token counts");
  assert(toolResults.some((result) => (result.savedTokens ?? 0) > 0), "expected tool compaction savings");
  assert(
    (recall.payloads ?? []).some((payload) => /中文|简洁|Felix/i.test(payload.text ?? "")),
    "expected recall reply to use remembered preferences",
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        configPath,
        installPath: repoRoot,
        memoryCount: memories.length,
        profileCount: profiles.length,
        toolCompactions: toolResults.length,
        latestProfile,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  mock.restore();
}

function runOpenClaw(args: string[], home: string): void {
  execFileSync("node", [path.join(repoRoot, "node_modules", "openclaw", "openclaw.mjs"), ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      OPENCLAW_HOME: home,
      OPENCLAW_RUNNER_LOG: "0",
    },
    stdio: "pipe",
  });
}

function withModelConfig(installedConfig: Record<string, unknown>): Record<string, unknown> {
  const plugins = (installedConfig.plugins ?? {}) as Record<string, unknown>;
  return {
    ...installedConfig,
    plugins: {
      ...plugins,
      allow: ["openclaw-recall"],
    },
    models: {
      providers: {
        openai: {
          baseUrl: "https://api.openai.com/v1",
          api: "openai-responses",
          apiKey: "sk-openclaw-recall-mock",
          models: [
            {
              id: "gpt-4.1-mini",
              name: "gpt-4.1-mini",
              api: "openai-responses",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 128000,
              maxTokens: 4096,
            },
          ],
        },
      },
    },
  };
}

async function run(
  api: OpenClawExtensionApi,
  params: Record<string, unknown>,
): Promise<EmbeddedRunResult> {
  return await api.runEmbeddedPiAgent(params);
}

async function importOpenClaw(): Promise<OpenClawExtensionApi> {
  const modulePath = path.join(repoRoot, "node_modules", "openclaw", "dist", "extensionAPI.js");
  const importer = new Function("specifier", "return import(specifier)") as (
    specifier: string,
  ) => Promise<OpenClawExtensionApi>;
  return await importer(pathToFileURL(modulePath).href);
}

function silentLogger() {
  return {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  };
}
