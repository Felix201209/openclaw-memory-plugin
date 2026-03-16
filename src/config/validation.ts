import type {
  ConfigValidationIssue,
  ConfigValidationReport,
  IdentityStatus,
} from "../types/domain.js";
import type { ResolvedPluginConfig } from "./schema.js";

export function getIdentityStatus(config: ResolvedPluginConfig): IdentityStatus {
  const warnings: string[] = [];
  const identityConfigured =
    config.identity.mode === "local" ||
    Boolean(config.identity.identityKey?.trim()) ||
    Boolean(config.identity.memorySpaceId?.trim());
  const reconnectReady =
    config.identity.mode === "local" ||
    Boolean(config.identity.identityKey?.trim() || config.identity.memorySpaceId?.trim());
  const reachability =
    config.identity.mode === "local"
      ? "local"
      : reconnectReady
        ? "configured"
        : "unavailable";

  if (config.identity.mode !== "local" && !config.identity.identityKey?.trim() && !config.identity.memorySpaceId?.trim()) {
    warnings.push("Reconnect/cloud mode requires identityKey or memorySpaceId.");
  }
  if (config.identity.backendType !== "local" && !config.identity.endpoint?.trim()) {
    warnings.push("Remote identity backend is configured without an explicit endpoint.");
  }
  if (config.identity.mode === "cloud" && !config.identity.apiKey?.trim()) {
    warnings.push("Cloud mode is configured but no identity API key was found.");
  }
  if (config.identity.mode === "shared" && !config.identity.sharedScope?.trim()) {
    warnings.push("Shared mode should set identity.sharedScope so multiple agents use the same logical space.");
  }

  return {
    mode: config.identity.mode,
    configured: identityConfigured,
    backendType: config.identity.backendType,
    workspaceScope: config.identity.workspaceScope,
    userScope: config.identity.userScope,
    identityKeyPresent: Boolean(config.identity.identityKey?.trim()),
    apiKeyPresent: Boolean(config.identity.apiKey?.trim()),
    memorySpaceId: config.identity.memorySpaceId,
    endpoint: config.identity.endpoint,
    sharedScope: config.identity.sharedScope,
    reconnectReady,
    reachability,
    warnings,
  };
}

export function validateResolvedConfig(
  config: ResolvedPluginConfig,
  precedence: string[],
): ConfigValidationReport {
  const issues: ConfigValidationIssue[] = [];
  const identity = getIdentityStatus(config);

  if (!config.inspect.httpPath.startsWith("/plugins/")) {
    issues.push({
      field: "inspect.httpPath",
      severity: "warn",
      message: "Inspect path should normally use the /plugins/ prefix.",
      repairHint: "Use /plugins/openclaw-recall or another plugin-prefixed route.",
    });
  }

  if (config.identity.mode !== "local" && !identity.configured) {
    issues.push({
      field: "identity.mode",
      severity: "error",
      message: `${config.identity.mode} mode requires identityKey or memorySpaceId.`,
      repairHint: "Run `openclaw-recall config init --mode reconnect --identity-key <key>` or provide memorySpaceId.",
    });
  }

  if ((config.identity.mode === "cloud" || config.identity.mode === "shared") && !config.identity.apiKey?.trim() && config.identity.backendType === "recall-http") {
    issues.push({
      field: "identity.apiKey",
      severity: "error",
      message: `${config.identity.mode} mode requires an identity API key for the HTTP backend.`,
      repairHint: "Set OPENCLAW_RECALL_IDENTITY_API_KEY or plugins.entries.openclaw-recall.config.identity.apiKey.",
    });
  }

  if (config.identity.backendType !== "local" && !config.identity.endpoint?.trim()) {
    issues.push({
      field: "identity.endpoint",
      severity: "warn",
      message: "Remote identity backend has no endpoint configured.",
      repairHint: "Set identity.endpoint so reconnect verification knows where to point.",
    });
  }

  if (config.identity.mode === "shared" && !config.identity.sharedScope?.trim()) {
    issues.push({
      field: "identity.sharedScope",
      severity: "error",
      message: "Shared mode requires identity.sharedScope.",
      repairHint: "Set OPENCLAW_RECALL_SHARED_SCOPE or plugins.entries.openclaw-recall.config.identity.sharedScope.",
    });
  }

  if (config.retrieval.mode === "embedding" && config.embedding.provider === "openai" && !config.embedding.apiKey?.trim()) {
    issues.push({
      field: "retrieval.mode",
      severity: "warn",
      message: "Embedding-only retrieval is configured but the OpenAI embedding API key is missing.",
      repairHint: "Set OPENCLAW_RECALL_EMBEDDING_API_KEY or switch retrieval.mode to hybrid/keyword.",
    });
  }

  if (config.imports.maxConcurrency > config.imports.maxFiles) {
    issues.push({
      field: "imports.maxConcurrency",
      severity: "warn",
      message: "Import concurrency is higher than the file limit.",
      repairHint: "Lower imports.maxConcurrency or raise imports.maxFiles.",
    });
  }

  if (!config.exports.directory?.trim()) {
    issues.push({
      field: "exports.directory",
      severity: "error",
      message: "Export directory cannot be empty.",
      repairHint: "Set exports.directory or OPENCLAW_RECALL_EXPORT_DIRECTORY.",
    });
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
    precedence,
  };
}
