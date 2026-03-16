import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { PluginContainer } from "../src/plugin/runtime-state.js";
import { resolvePluginConfig } from "../src/config/loader.js";
import { ImportService } from "../src/importing/ImportService.js";
import { ExportService } from "../src/exporting/ExportService.js";
import { createTempDir, cleanupTempDir } from "./helpers/temp-db.js";

test("import dry-run reports imported, duplicate, and rejected candidates", async () => {
  const tempDir = await createTempDir("openclaw-recall-import-");
  const previousHome = process.env.OPENCLAW_HOME;
  try {
    process.env.OPENCLAW_HOME = tempDir;
    const fixtureRoot = path.join(tempDir, "fixtures");
    await fs.mkdir(path.join(fixtureRoot, "sessions"), { recursive: true });
    await fs.mkdir(path.join(fixtureRoot, "memories"), { recursive: true });
    await fs.writeFile(
      path.join(fixtureRoot, "sessions", "demo.json"),
      JSON.stringify({
        turns: [
          {
            id: "u1",
            sessionId: "import-session-1",
            role: "user",
            text: "以后默认叫我 Felix，用中文回答，并且尽量简洁。",
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    );
    await fs.writeFile(
      path.join(fixtureRoot, "memories", "noise.json"),
      JSON.stringify([
        { kind: "session_state", summary: 'Sender (untrusted metadata): {"label":"openclaw-control-ui"}' },
      ]),
    );

    const container = createTestContainer(tempDir);
    const importer = new ImportService(container, container.config, fixtureRoot);
    const report = await importer.dryRun();

    assert.equal(report.mode, "dry-run");
    assert.ok(report.imported >= 1);
    assert.ok(report.rejectedNoise >= 1);
  } finally {
    if (previousHome === undefined) {
      delete process.env.OPENCLAW_HOME;
    } else {
      process.env.OPENCLAW_HOME = previousHome;
    }
    await cleanupTempDir(tempDir);
  }
});

test("import run writes memories and duplicate reruns are skipped/merged", async () => {
  const tempDir = await createTempDir("openclaw-recall-import-");
  const previousHome = process.env.OPENCLAW_HOME;
  try {
    process.env.OPENCLAW_HOME = tempDir;
    const fixtureRoot = path.join(tempDir, "fixtures");
    await fs.mkdir(path.join(fixtureRoot, "sessions"), { recursive: true });
    await fs.writeFile(
      path.join(fixtureRoot, "sessions", "demo.json"),
      JSON.stringify({
        turns: [
          {
            id: "u1",
            sessionId: "import-session-1",
            role: "user",
            text: "以后默认叫我 Felix，用中文回答，并且尽量简洁。",
            createdAt: new Date().toISOString(),
          },
          {
            id: "u2",
            sessionId: "import-session-1",
            role: "user",
            text: "之后跟我协作时偏直接、偏执行导向，汇报时用结论、进度、风险、下一步这种结构。",
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    );

    const container = createTestContainer(tempDir);
    const importer = new ImportService(container, container.config, fixtureRoot);
    const first = await importer.run();
    const second = await importer.run();
    const memories = await container.memoryStore.listActive();
    const status = await importer.status();

    assert.ok(first.imported >= 1);
    assert.ok(second.skippedDuplicates >= 1);
    assert.ok(memories.length >= 2);
    assert.equal(status?.jobId, second.jobId);
  } finally {
    if (previousHome === undefined) {
      delete process.env.OPENCLAW_HOME;
    } else {
      process.env.OPENCLAW_HOME = previousHome;
    }
    await cleanupTempDir(tempDir);
  }
});

test("export writes recovery files and supports import/export roundtrip", async () => {
  const tempDir = await createTempDir("openclaw-recall-export-");
  const previousHome = process.env.OPENCLAW_HOME;
  try {
    process.env.OPENCLAW_HOME = tempDir;
    const source = createTestContainer(tempDir);
    await source.memoryStore.upsertMany([
      {
        id: "m1",
        kind: "preference",
        summary: "User prefers concise execution-oriented updates.",
        content: "User prefers concise execution-oriented updates.",
        topics: ["concise", "execution", "updates"],
        entityKeys: [],
        salience: 8.5,
        fingerprint: "pref-1",
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        ttlDays: 180,
        decayRate: 0.01,
        confidence: 0.9,
        importance: 8.5,
        active: true,
        sourceSessionId: "manual",
        sourceTurnIds: ["manual-1"],
      },
    ]);
    await source.eventStore.appendTurn({
      id: "turn-1",
      sessionId: "session-export-1",
      role: "user",
      text: "Remember my concise execution-oriented preference.",
      createdAt: new Date().toISOString(),
    });
    await source.profileStore.record({
      runId: "run-1",
      sessionId: "session-export-1",
      createdAt: new Date().toISOString(),
      promptTokens: 10,
      promptTokensSource: "exact",
      promptBudget: 2400,
      memoryInjected: 1,
      memoryCandidates: 1,
      memoryWritten: 1,
      toolTokens: 0,
      toolTokensSource: "exact",
      toolTokensSaved: 0,
      toolTokensSavedSource: "exact",
      historySummaryTokens: 0,
      historySummaryTokensSource: "exact",
      compressionSavings: 0,
      compressionSavingsSource: "exact",
      retrievalCount: 1,
    });

    const exporter = new ExportService(source, source.config);
    const memoryExport = await exporter.exportMemory("json");
    const profileExport = await exporter.exportProfile("json");
    const sessionExport = await exporter.exportSession("session-export-1", "json");
    assert.ok(memoryExport.itemCount >= 1);
    assert.ok(profileExport.itemCount >= 1);
    assert.ok(sessionExport.itemCount >= 1);

    const recoveryHome = path.join(tempDir, "recovery-home");
    process.env.OPENCLAW_HOME = recoveryHome;
    const target = createTestContainer(recoveryHome);
    const importer = new ImportService(target, target.config, path.dirname(memoryExport.outputPath));
    const report = await importer.run([memoryExport.outputPath]);
    const latestExport = await exporter.latest();

    assert.ok(report.imported >= 1);
    assert.ok((await target.memoryStore.listActive()).length >= 1);
    assert.equal(latestExport?.outputPath, sessionExport.outputPath);
  } finally {
    if (previousHome === undefined) {
      delete process.env.OPENCLAW_HOME;
    } else {
      process.env.OPENCLAW_HOME = previousHome;
    }
    await cleanupTempDir(tempDir);
  }
});

test("shared scope is opt-in on import but preserved for exported artifacts", async () => {
  const tempDir = await createTempDir("openclaw-recall-import-scope-");
  const previousHome = process.env.OPENCLAW_HOME;
  try {
    process.env.OPENCLAW_HOME = tempDir;
    const fixtureRoot = path.join(tempDir, "fixtures");
    await fs.mkdir(path.join(fixtureRoot, "memories"), { recursive: true });
    await fs.writeFile(
      path.join(fixtureRoot, "memories", "semantic.json"),
      JSON.stringify([
        {
          kind: "semantic",
          summary: "Project context: team roadmap for Recall v1.1.",
          content: "Project context: team roadmap for Recall v1.1.",
          scope: "shared",
          scopeKey: "shared:team-alpha",
          sourceSessionId: "imported-memory",
        },
      ]),
    );

    const sharedContainer = createTestContainer(tempDir, {
      identity: { mode: "shared", sharedScope: "team-alpha", workspaceScope: "workspace-a", userScope: "felix" },
    });
    const importer = new ImportService(sharedContainer, sharedContainer.config, fixtureRoot);
    const report = await importer.run();
    const imported = await sharedContainer.memoryStore.listActive();
    assert.ok((report.scopeCounts?.workspace ?? 0) >= 1);
    assert.equal(imported[0].scope, "workspace");

    const exporter = new ExportService(sharedContainer, sharedContainer.config);
    const exportReport = await exporter.exportMemory("json");

    const artifactHome = path.join(tempDir, "artifact-home");
    process.env.OPENCLAW_HOME = artifactHome;
    const artifactContainer = createTestContainer(artifactHome, {
      identity: { mode: "shared", sharedScope: "team-alpha", workspaceScope: "workspace-a", userScope: "felix" },
    });
    const artifactImporter = new ImportService(artifactContainer, artifactContainer.config, path.dirname(exportReport.outputPath));
    const artifactRun = await artifactImporter.run([exportReport.outputPath]);
    const restored = await artifactContainer.memoryStore.listActive();
    assert.ok(artifactRun.imported >= 1);
    assert.equal(restored[0].scope, "workspace");
  } finally {
    if (previousHome === undefined) {
      delete process.env.OPENCLAW_HOME;
    } else {
      process.env.OPENCLAW_HOME = previousHome;
    }
    await cleanupTempDir(tempDir);
  }
});

test("import rejects sensitive rows and tracks uncertain candidates", async () => {
  const tempDir = await createTempDir("openclaw-recall-import-sensitive-");
  const previousHome = process.env.OPENCLAW_HOME;
  try {
    process.env.OPENCLAW_HOME = tempDir;
    const fixtureRoot = path.join(tempDir, "fixtures");
    await fs.mkdir(path.join(fixtureRoot, "memories"), { recursive: true });
    await fs.writeFile(
      path.join(fixtureRoot, "memories", "mixed.json"),
      JSON.stringify([
        {
          kind: "semantic",
          summary: "api key is sk-test-12345678901234567890",
          content: "api key is sk-test-12345678901234567890",
        },
        {
          kind: "episodic",
          summary: "Talked about a rough draft once.",
          content: "Talked about a rough draft once.",
        },
      ]),
    );
    const container = createTestContainer(tempDir);
    const importer = new ImportService(container, container.config, fixtureRoot);
    const report = await importer.dryRun();
    assert.ok(report.rejectedSensitive >= 1);
    assert.ok(report.uncertainCandidates >= 1);
  } finally {
    if (previousHome === undefined) {
      delete process.env.OPENCLAW_HOME;
    } else {
      process.env.OPENCLAW_HOME = previousHome;
    }
    await cleanupTempDir(tempDir);
  }
});

function createTestContainer(
  openclawHome: string,
  overrides: {
    identity?: Partial<ReturnType<typeof resolvePluginConfig>["identity"]>;
  } = {},
): PluginContainer {
  return new PluginContainer(
    resolvePluginConfig({
      env: {
        ...process.env,
        OPENCLAW_HOME: openclawHome,
      },
      pluginConfig: {
        storageDir: path.join(openclawHome, ".openclaw", "plugins", "openclaw-recall"),
        identity: { mode: "local", ...overrides.identity },
      },
      openclawHome: path.join(openclawHome, ".openclaw"),
    }),
    {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
  );
}
