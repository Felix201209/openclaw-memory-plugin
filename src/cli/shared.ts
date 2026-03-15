import fs from "node:fs/promises";
import path from "node:path";
import JSON5 from "json5";
import { Command } from "commander";
import { listPluginEnvOverrides, resolvePluginConfig, resolveOpenClawHome } from "../config/loader.js";
import type { OpenClawMemoryPluginConfig, ResolvedPluginConfig } from "../config/schema.js";
import { getOrCreatePluginContainer, type PluginLogger } from "../plugin/runtime-state.js";

const PRIMARY_PLUGIN_ID = "openclaw-recall";
const LEGACY_PLUGIN_ID = "openclaw-memory-plugin";

export async function loadOpenClawPluginConfig(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  openclawHome: string;
  configPath: string;
  configExists: boolean;
  openclawConfig: Record<string, unknown>;
  pluginConfig: OpenClawMemoryPluginConfig | undefined;
  enabled: boolean;
  resolved: ResolvedPluginConfig;
}> {
  const openclawHome = resolveOpenClawHome(env);
  const configPath = path.join(openclawHome, "openclaw.json");
  const raw = await readConfig(configPath);
  const plugins = (raw.plugins ?? {}) as Record<string, unknown>;
  const entries = (plugins.entries ?? {}) as Record<string, unknown>;
  const pluginEntry = (entries[PRIMARY_PLUGIN_ID] ??
    entries[LEGACY_PLUGIN_ID]) as Record<string, unknown> | undefined;
  const pluginConfig = pluginEntry?.config as OpenClawMemoryPluginConfig | undefined;
  const enabled = pluginEntry?.enabled !== false;
  const resolved = resolvePluginConfig({
    pluginConfig,
    env,
    openclawHome,
  });

  return {
    openclawHome,
    configPath,
    configExists: raw.__exists === true,
    openclawConfig: raw,
    pluginConfig,
    enabled,
    resolved,
  };
}

export async function createCliContainer(
  env: NodeJS.ProcessEnv = process.env,
  logger: PluginLogger = defaultLogger(),
) {
  const loaded = await loadOpenClawPluginConfig(env);
  const container = getOrCreatePluginContainer({
    config: loaded.resolved,
    logger,
  });
  return {
    ...loaded,
    container,
  };
}

export async function writeOpenClawConfig(filePath: string, value: Record<string, unknown>): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2));
}

export function pluginConfigSources(env: NodeJS.ProcessEnv = process.env): string[] {
  const envOverrides = listPluginEnvOverrides(env);
  return [
    ...envOverrides,
    "plugins.entries.openclaw-recall.config",
    "defaults",
  ];
}

export function addJsonFlag(command: Command): Command {
  return command.option("--json", "Render raw JSON output");
}

export function printOutput(command: Command, payload: unknown): void {
  if (command.opts<{ json?: boolean }>().json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (typeof payload === "string") {
    process.stdout.write(`${payload}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function defaultLogger(): PluginLogger {
  return {
    info: (message: string) => process.stderr.write(`${message}\n`),
    warn: (message: string) => process.stderr.write(`${message}\n`),
    error: (message: string) => process.stderr.write(`${message}\n`),
    debug: (message: string) => process.stderr.write(`${message}\n`),
  };
}

export async function readConfig(filePath: string): Promise<Record<string, unknown> & { __exists?: boolean }> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON5.parse(raw) as Record<string, unknown>;
    return { __exists: true, ...parsed };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}
