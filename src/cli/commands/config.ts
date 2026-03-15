import { Command } from "commander";
import { buildDefaultPluginEntry } from "../../config/defaults.js";
import {
  addJsonFlag,
  loadOpenClawPluginConfig,
  pluginConfigSources,
  printOutput,
  writeOpenClawConfig,
} from "../shared.js";
import type { ConfigValidationIssue, ConfigValidationReport } from "../../types/domain.js";

export function registerConfigCommands(program: Command): void {
  const config = addJsonFlag(program.command("config").description("Inspect plugin configuration"));

  addJsonFlag(
    config
      .command("init")
      .description("Print or write a starter plugin config entry")
      .option("--write-openclaw", "Merge the starter entry into the active openclaw.json")
      .action(async function action() {
        const loaded = await loadOpenClawPluginConfig();
        const entry = buildDefaultPluginEntry();

        if (!this.opts().writeOpenclaw) {
          printOutput(this, {
            plugins: {
              entries: {
                "openclaw-recall": entry,
              },
            },
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
        });
      }),
  );

  addJsonFlag(
    config.command("show").action(async function action() {
      const loaded = await loadOpenClawPluginConfig();
      printOutput(this, {
        openclawHome: loaded.openclawHome,
        configPath: loaded.configPath,
        configExists: loaded.configExists,
        enabled: loaded.enabled,
        pluginConfig: loaded.pluginConfig ?? {},
        resolved: loaded.resolved,
        precedence: pluginConfigSources(),
      });
    }),
  );

  addJsonFlag(
    config.command("validate").description("Validate plugin configuration").action(async function action() {
      const loaded = await loadOpenClawPluginConfig();
      const issues: ConfigValidationIssue[] = [];

      if (!loaded.configExists) {
        issues.push({
          field: "openclaw.json",
          severity: "warn",
          message: "OpenClaw config does not exist yet.",
          repairHint: "Run `openclaw plugins install --link /path/to/openclaw-recall` first.",
        });
      }

      if (!loaded.enabled) {
        issues.push({
          field: "plugins.entries.openclaw-recall.enabled",
          severity: "warn",
          message: "Plugin entry is disabled.",
          repairHint: "Run `openclaw plugins enable openclaw-recall`.",
        });
      }

      if (
        loaded.resolved.embedding.provider === "openai" &&
        !loaded.resolved.embedding.apiKey?.trim()
      ) {
        issues.push({
          field: "embedding.apiKey",
          severity: "error",
          message: "OpenAI-compatible embeddings were selected but no API key was found.",
          repairHint: "Set OPENCLAW_RECALL_EMBEDDING_API_KEY or plugins.entries.openclaw-recall.config.embedding.apiKey.",
        });
      }

      if (!loaded.resolved.inspect.httpPath.startsWith("/plugins/")) {
        issues.push({
          field: "inspect.httpPath",
          severity: "warn",
          message: "Inspect path does not use the standard /plugins/ prefix.",
          repairHint: "Use /plugins/openclaw-recall or another plugin-prefixed route.",
        });
      }

      const report: ConfigValidationReport = {
        valid: !issues.some((issue) => issue.severity === "error"),
        issues,
        precedence: pluginConfigSources(),
      };
      printOutput(this, report);
    }),
  );
}
