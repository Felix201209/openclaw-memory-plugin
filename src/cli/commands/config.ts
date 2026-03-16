import { Command } from "commander";
import { buildDefaultPluginEntry } from "../../config/defaults.js";
import { validateResolvedConfig } from "../../config/validation.js";
import {
  addJsonFlag,
  loadOpenClawPluginConfig,
  pluginConfigSources,
  printOutput,
  writeOpenClawConfig,
} from "../shared.js";
import type { ConfigValidationReport } from "../../types/domain.js";

export function registerConfigCommands(program: Command): void {
  const config = addJsonFlag(program.command("config").description("Inspect plugin configuration"));

  addJsonFlag(
    config
      .command("init")
      .description("Print or write a starter plugin config entry")
      .option("--mode <mode>", "Identity mode: local | reconnect | cloud | shared", "local")
      .option("--backend <type>", "Backend type: local | recall-http | custom")
      .option("--identity-key <key>", "Persistent identity key for reconnect mode")
      .option("--memory-space <id>", "Existing memory space id")
      .option("--api-key <key>", "Remote memory backend API key")
      .option("--endpoint <url>", "Remote memory backend endpoint")
      .option("--workspace-scope <name>", "Workspace-scoped identity label")
      .option("--user-scope <name>", "User-scoped identity label")
      .option("--shared-scope <name>", "Shared scope label for cross-agent recall")
      .option("--retrieval-mode <mode>", "Retrieval mode: keyword | embedding | hybrid")
      .option("--write-openclaw", "Merge the starter entry into the active openclaw.json")
      .action(async function action() {
        const loaded = await loadOpenClawPluginConfig();
        const options = this.opts();
        const entry = buildDefaultPluginEntry({
          identity: {
            mode: options.mode,
            backendType: options.backend ?? (options.mode === "local" ? "local" : "recall-http"),
            identityKey: options.identityKey,
            apiKey: options.apiKey,
            memorySpaceId: options.memorySpace,
            endpoint: options.endpoint,
            workspaceScope: options.workspaceScope,
            userScope: options.userScope,
            sharedScope: options.sharedScope,
            verifyOnStartup: true,
          },
          retrieval: options.retrievalMode
            ? {
                mode: options.retrievalMode,
              }
            : undefined,
        });

        if (!this.opts().writeOpenclaw) {
          printOutput(this, {
            plugins: {
              entries: {
                "openclaw-recall": entry,
              },
            },
            nextSteps: nextStepsForMode(options.mode),
          });
          return;
        }

        const nextConfig = {
          ...loaded.openclawConfig,
          plugins: {
            ...((loaded.openclawConfig.plugins ?? {}) as Record<string, unknown>),
            entries: {
              ...((((loaded.openclawConfig.plugins ?? {}) as Record<string, unknown>).entries ?? {}) as Record<string, unknown>),
              "openclaw-recall": entry,
            },
          },
        };
        delete (nextConfig as { __exists?: boolean }).__exists;
        await writeOpenClawConfig(loaded.configPath, nextConfig);
        printOutput(this, {
          ok: true,
          wrote: loaded.configPath,
          entry: "plugins.entries.openclaw-recall",
          nextSteps: nextStepsForMode(options.mode),
        });
      }),
  );

  addJsonFlag(
    config.command("show").action(async function action() {
      const loaded = await loadOpenClawPluginConfig();
      const validation = validateResolvedConfig(loaded.resolved, pluginConfigSources());
      printOutput(this, {
        openclawHome: loaded.openclawHome,
        configPath: loaded.configPath,
        configExists: loaded.configExists,
        enabled: loaded.enabled,
        pluginConfig: loaded.pluginConfig ?? {},
        resolved: loaded.resolved,
        identityMode: loaded.resolved.identity.mode,
        validation,
        precedence: pluginConfigSources(),
      });
    }),
  );

  addJsonFlag(
    config.command("validate").description("Validate plugin configuration").action(async function action() {
      const loaded = await loadOpenClawPluginConfig();
      const report: ConfigValidationReport = validateResolvedConfig(
        loaded.resolved,
        pluginConfigSources(),
      );
      if (!loaded.configExists) {
        report.issues.unshift({
          field: "openclaw.json",
          severity: "warn",
          message: "OpenClaw config does not exist yet.",
          repairHint: "Run `openclaw plugins install --link /path/to/openclaw-recall` first.",
        });
      }
      if (!loaded.enabled) {
        report.issues.unshift({
          field: "plugins.entries.openclaw-recall.enabled",
          severity: "warn",
          message: "Plugin entry is disabled.",
          repairHint: "Run `openclaw plugins enable openclaw-recall`.",
        });
      }
      printOutput(this, report);
    }),
  );
}

function nextStepsForMode(mode: string): string[] {
  if (mode === "local") {
    return [
      "Run `openclaw-recall config validate`.",
      "Import existing sessions with `openclaw-recall import dry-run` then `openclaw-recall import run`.",
      "Verify with `openclaw-recall doctor` and `openclaw-recall status`.",
    ];
  }
  return [
    "Run `openclaw-recall config validate` to confirm reconnect fields are complete.",
    "Reconnects restore the same memory space identity, so keep the identity key secret.",
    "Import old sessions next with `openclaw-recall import run` so the restored space has useful memory.",
  ];
}
