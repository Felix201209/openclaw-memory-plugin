import type { ResolvedPluginConfig } from "../config/schema.js";
import type { MemoryKind, MemoryRecord, MemoryScope } from "../types/domain.js";

export function assignMemoryScope(
  memory: MemoryRecord,
  config: ResolvedPluginConfig,
  sessionId: string,
): MemoryRecord {
  const scope = memory.scope ?? defaultScopeFor(memory.kind, config);
  const scopeKey =
    memory.scopeKey ??
    defaultScopeKey(scope, config, sessionId);

  return {
    ...memory,
    scope,
    scopeKey,
  };
}

export function isMemoryVisible(
  memory: Pick<MemoryRecord, "scope" | "scopeKey" | "sourceSessionId">,
  config: ResolvedPluginConfig,
  sessionId?: string,
): boolean {
  const scope = memory.scope ?? "private";
  const scopeKey = memory.scopeKey ?? defaultScopeKey(scope, config, memory.sourceSessionId);
  if (scope === "private") {
    return scopeKey === defaultScopeKey("private", config, sessionId ?? memory.sourceSessionId);
  }
  if (scope === "workspace") {
    return scopeKey === defaultScopeKey("workspace", config, sessionId ?? memory.sourceSessionId);
  }
  if (scope === "shared") {
    return Boolean(config.identity.sharedScope?.trim()) &&
      scopeKey === defaultScopeKey("shared", config, sessionId ?? memory.sourceSessionId);
  }
  return scopeKey === defaultScopeKey("session", config, sessionId ?? memory.sourceSessionId);
}

export function defaultScopeFor(kind: MemoryKind, config: ResolvedPluginConfig): MemoryScope {
  if (kind === "preference") {
    return "private";
  }
  if (kind === "session_state") {
    return "session";
  }
  if (kind === "semantic") {
    return "workspace";
  }
  return "private";
}

export function defaultScopeKey(
  scope: MemoryScope,
  config: ResolvedPluginConfig,
  sessionId: string,
): string {
  if (scope === "private") {
    return `user:${config.identity.userScope ?? "default"}`;
  }
  if (scope === "workspace") {
    return `workspace:${config.identity.workspaceScope ?? "default"}`;
  }
  if (scope === "shared") {
    return `shared:${config.identity.sharedScope ?? config.identity.workspaceScope ?? "default"}`;
  }
  return `session:${sessionId}`;
}
