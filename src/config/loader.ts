import path from "node:path";
import { homedir } from "node:os";
import { defaultPluginConfig } from "./defaults.js";
import type { OpenClawMemoryPluginConfig, ResolvedPluginConfig } from "./schema.js";

const PRIMARY_ENV_PREFIX = "OPENCLAW_RECALL_";
const LEGACY_ENV_PREFIX = "OPENCLAW_MEMORY_PLUGIN_";

export function resolveOpenClawHome(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.OPENCLAW_HOME?.trim();
  if (!configured) {
    return path.join(homedir(), ".openclaw");
  }
  return path.basename(configured) === ".openclaw"
    ? configured
    : path.join(configured, ".openclaw");
}

export function resolvePluginStateDir(
  pluginConfig: OpenClawMemoryPluginConfig | undefined,
  openclawHome: string,
): string {
  return pluginConfig?.storageDir?.trim() || path.join(openclawHome, "plugins", "openclaw-recall");
}

export function resolvePluginConfig(params: {
  pluginConfig?: OpenClawMemoryPluginConfig;
  env?: NodeJS.ProcessEnv;
  openclawHome?: string;
}): ResolvedPluginConfig {
  const env = params.env ?? process.env;
  const pluginConfig = params.pluginConfig ?? {};
  const openclawHome = params.openclawHome ?? resolveOpenClawHome(env);
  const storageDir = resolvePluginStateDir(pluginConfig, openclawHome);

  const embeddingProvider = readEnv(env, "EMBEDDING_PROVIDER")?.trim() as
    | "local"
    | "openai"
    | undefined;

  return {
    enabled: pluginConfig.enabled ?? true,
    storageDir,
    databasePath: path.join(storageDir, "memory.sqlite"),
    identity: {
      mode:
        (readEnv(env, "IDENTITY_MODE")?.trim() as "local" | "reconnect" | "cloud" | "shared" | undefined) ??
        pluginConfig.identity?.mode ??
        defaultPluginConfig.identity.mode,
      backendType:
        (readEnv(env, "IDENTITY_BACKEND")?.trim() as "local" | "recall-http" | "custom" | undefined) ??
        pluginConfig.identity?.backendType ??
        defaultPluginConfig.identity.backendType,
      identityKey:
        readEnv(env, "IDENTITY_KEY")?.trim() ||
        pluginConfig.identity?.identityKey,
      apiKey:
        readEnv(env, "IDENTITY_API_KEY")?.trim() ||
        pluginConfig.identity?.apiKey,
      memorySpaceId:
        readEnv(env, "MEMORY_SPACE_ID")?.trim() ||
        pluginConfig.identity?.memorySpaceId,
      endpoint:
        readEnv(env, "IDENTITY_ENDPOINT")?.trim() ||
        pluginConfig.identity?.endpoint,
      workspaceScope:
        readEnv(env, "WORKSPACE_SCOPE")?.trim() ||
        pluginConfig.identity?.workspaceScope,
      userScope:
        readEnv(env, "USER_SCOPE")?.trim() ||
        pluginConfig.identity?.userScope,
      sharedScope:
        readEnv(env, "SHARED_SCOPE")?.trim() ||
        pluginConfig.identity?.sharedScope,
      verifyOnStartup:
        parseBoolean(readEnv(env, "VERIFY_IDENTITY")) ??
        pluginConfig.identity?.verifyOnStartup ??
        defaultPluginConfig.identity.verifyOnStartup,
    },
    embedding: {
      provider:
        embeddingProvider ??
        pluginConfig.embedding?.provider ??
        defaultPluginConfig.embedding.provider,
      apiKey:
        readEnv(env, "EMBEDDING_API_KEY")?.trim() ||
        pluginConfig.embedding?.apiKey,
      model:
        readEnv(env, "EMBEDDING_MODEL")?.trim() ||
        pluginConfig.embedding?.model ||
        defaultPluginConfig.embedding.model,
      baseUrl:
        readEnv(env, "EMBEDDING_BASE_URL")?.trim() ||
        pluginConfig.embedding?.baseUrl ||
        defaultPluginConfig.embedding.baseUrl,
      dimensions:
        parseNumber(readEnv(env, "EMBEDDING_DIMENSIONS")) ??
        pluginConfig.embedding?.dimensions ??
        defaultPluginConfig.embedding.dimensions,
    },
    memory: {
      autoWrite:
        parseBoolean(readEnv(env, "AUTO_WRITE")) ??
        pluginConfig.memory?.autoWrite ??
        defaultPluginConfig.memory.autoWrite,
      topK:
        parseNumber(readEnv(env, "MEMORY_TOP_K")) ??
        pluginConfig.memory?.topK ??
        defaultPluginConfig.memory.topK,
      bootTopK:
        parseNumber(readEnv(env, "BOOT_TOP_K")) ??
        pluginConfig.memory?.bootTopK ??
        defaultPluginConfig.memory.bootTopK,
      maxWritesPerTurn:
        parseNumber(readEnv(env, "MAX_WRITES")) ??
        pluginConfig.memory?.maxWritesPerTurn ??
        defaultPluginConfig.memory.maxWritesPerTurn,
      dedupeSimilarity:
        parseNumber(readEnv(env, "DEDUPE_SIMILARITY")) ??
        pluginConfig.memory?.dedupeSimilarity ??
        defaultPluginConfig.memory.dedupeSimilarity,
      writeThreshold:
        parseNumber(readEnv(env, "WRITE_THRESHOLD")) ??
        pluginConfig.memory?.writeThreshold ??
        defaultPluginConfig.memory.writeThreshold,
      preferenceTtlDays:
        parseNumber(readEnv(env, "PREFERENCE_TTL_DAYS")) ??
        pluginConfig.memory?.preferenceTtlDays ??
        defaultPluginConfig.memory.preferenceTtlDays,
      semanticTtlDays:
        parseNumber(readEnv(env, "SEMANTIC_TTL_DAYS")) ??
        pluginConfig.memory?.semanticTtlDays ??
        defaultPluginConfig.memory.semanticTtlDays,
      episodicTtlDays:
        parseNumber(readEnv(env, "EPISODIC_TTL_DAYS")) ??
        pluginConfig.memory?.episodicTtlDays ??
        defaultPluginConfig.memory.episodicTtlDays,
      sessionStateTtlDays:
        parseNumber(readEnv(env, "SESSION_STATE_TTL_DAYS")) ??
        pluginConfig.memory?.sessionStateTtlDays ??
        defaultPluginConfig.memory.sessionStateTtlDays,
    },
    retrieval: {
      mode:
        (readEnv(env, "RETRIEVAL_MODE")?.trim() as "keyword" | "embedding" | "hybrid" | undefined) ??
        pluginConfig.retrieval?.mode ??
        defaultPluginConfig.retrieval.mode,
      fallbackToKeyword:
        parseBoolean(readEnv(env, "RETRIEVAL_FALLBACK_TO_KEYWORD")) ??
        pluginConfig.retrieval?.fallbackToKeyword ??
        defaultPluginConfig.retrieval.fallbackToKeyword,
    },
    compression: {
      recentTurns:
        parseNumber(readEnv(env, "RECENT_TURNS")) ??
        pluginConfig.compression?.recentTurns ??
        defaultPluginConfig.compression.recentTurns,
      contextBudget:
        parseNumber(readEnv(env, "CONTEXT_BUDGET")) ??
        pluginConfig.compression?.contextBudget ??
        defaultPluginConfig.compression.contextBudget,
      historySummaryThreshold:
        parseNumber(readEnv(env, "HISTORY_THRESHOLD")) ??
        pluginConfig.compression?.historySummaryThreshold ??
        defaultPluginConfig.compression.historySummaryThreshold,
      toolCompactionThresholdChars:
        parseNumber(readEnv(env, "TOOL_THRESHOLD")) ??
        pluginConfig.compression?.toolCompactionThresholdChars ??
        defaultPluginConfig.compression.toolCompactionThresholdChars,
    },
    profile: {
      retainRuns:
        parseNumber(readEnv(env, "PROFILE_RETAIN_RUNS")) ??
        pluginConfig.profile?.retainRuns ??
        defaultPluginConfig.profile.retainRuns,
      storeDetails:
        parseBoolean(readEnv(env, "PROFILE_STORE_DETAILS")) ??
        pluginConfig.profile?.storeDetails ??
        defaultPluginConfig.profile.storeDetails,
    },
    inspect: {
      httpPath:
        readEnv(env, "HTTP_PATH")?.trim() ||
        pluginConfig.inspect?.httpPath ||
        defaultPluginConfig.inspect.httpPath,
    },
    imports: {
      enabled:
        parseBoolean(readEnv(env, "IMPORTS_ENABLED")) ??
        pluginConfig.imports?.enabled ??
        defaultPluginConfig.imports.enabled,
      defaultRoots:
        parseList(readEnv(env, "IMPORT_ROOTS")) ??
        pluginConfig.imports?.defaultRoots ??
        defaultPluginConfig.imports.defaultRoots,
      maxFiles:
        parseNumber(readEnv(env, "IMPORT_MAX_FILES")) ??
        pluginConfig.imports?.maxFiles ??
        defaultPluginConfig.imports.maxFiles,
      maxConcurrency:
        parseNumber(readEnv(env, "IMPORT_MAX_CONCURRENCY")) ??
        pluginConfig.imports?.maxConcurrency ??
        defaultPluginConfig.imports.maxConcurrency,
    },
    exports: {
      directory:
        readEnv(env, "EXPORT_DIRECTORY")?.trim() ||
        pluginConfig.exports?.directory ||
        defaultPluginConfig.exports.directory,
      defaultFormat:
        (readEnv(env, "EXPORT_FORMAT")?.trim() as "json" | "jsonl" | undefined) ??
        pluginConfig.exports?.defaultFormat ??
        defaultPluginConfig.exports.defaultFormat,
    },
  };
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  if (/^(1|true|yes|on)$/i.test(value)) {
    return true;
  }
  if (/^(0|false|no|off)$/i.test(value)) {
    return false;
  }
  return undefined;
}

function parseList(value: string | undefined): string[] | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listPluginEnvOverrides(env: NodeJS.ProcessEnv = process.env): string[] {
  return Object.keys(env)
    .filter(
      (key) =>
        (key.startsWith(PRIMARY_ENV_PREFIX) || key.startsWith(LEGACY_ENV_PREFIX)) &&
        env[key]?.trim(),
    )
    .sort();
}

function readEnv(env: NodeJS.ProcessEnv, suffix: string): string | undefined {
  return env[`${PRIMARY_ENV_PREFIX}${suffix}`] ?? env[`${LEGACY_ENV_PREFIX}${suffix}`];
}
