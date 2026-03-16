import { DEFAULT_HTTP_PATH } from "./defaults.js";

export type EmbeddingProviderId = "local" | "openai";
export type IdentityMode = "local" | "reconnect" | "cloud" | "shared";
export type RetrievalMode = "keyword" | "embedding" | "hybrid";

export type OpenClawMemoryPluginConfig = {
  enabled?: boolean;
  storageDir?: string;
  identity?: {
    mode?: IdentityMode;
    backendType?: "local" | "recall-http" | "custom";
    identityKey?: string;
    apiKey?: string;
    memorySpaceId?: string;
    endpoint?: string;
    workspaceScope?: string;
    userScope?: string;
    sharedScope?: string;
    verifyOnStartup?: boolean;
  };
  embedding?: {
    provider?: EmbeddingProviderId;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    dimensions?: number;
  };
  memory?: {
    autoWrite?: boolean;
    topK?: number;
    bootTopK?: number;
    maxWritesPerTurn?: number;
    dedupeSimilarity?: number;
    writeThreshold?: number;
    preferenceTtlDays?: number;
    semanticTtlDays?: number;
    episodicTtlDays?: number;
    sessionStateTtlDays?: number;
  };
  retrieval?: {
    mode?: RetrievalMode;
    fallbackToKeyword?: boolean;
  };
  compression?: {
    recentTurns?: number;
    contextBudget?: number;
    historySummaryThreshold?: number;
    toolCompactionThresholdChars?: number;
  };
  profile?: {
    retainRuns?: number;
    storeDetails?: boolean;
  };
  inspect?: {
    httpPath?: string;
  };
  imports?: {
    enabled?: boolean;
    defaultRoots?: string[];
    maxFiles?: number;
    maxConcurrency?: number;
  };
  exports?: {
    directory?: string;
    defaultFormat?: "json" | "jsonl";
  };
};

export type ResolvedPluginConfig = {
  enabled: boolean;
  storageDir: string;
  databasePath: string;
  identity: {
    mode: IdentityMode;
    backendType: "local" | "recall-http" | "custom";
    identityKey?: string;
    apiKey?: string;
    memorySpaceId?: string;
    endpoint?: string;
    workspaceScope?: string;
    userScope?: string;
    sharedScope?: string;
    verifyOnStartup: boolean;
  };
  embedding: {
    provider: EmbeddingProviderId;
    apiKey?: string;
    model: string;
    baseUrl: string;
    dimensions: number;
  };
  memory: {
    autoWrite: boolean;
    topK: number;
    bootTopK: number;
    maxWritesPerTurn: number;
    dedupeSimilarity: number;
    writeThreshold: number;
    preferenceTtlDays: number;
    semanticTtlDays: number;
    episodicTtlDays: number;
    sessionStateTtlDays: number;
  };
  retrieval: {
    mode: RetrievalMode;
    fallbackToKeyword: boolean;
  };
  compression: {
    recentTurns: number;
    contextBudget: number;
    historySummaryThreshold: number;
    toolCompactionThresholdChars: number;
  };
  profile: {
    retainRuns: number;
    storeDetails: boolean;
  };
  inspect: {
    httpPath: string;
  };
  imports: {
    enabled: boolean;
    defaultRoots: string[];
    maxFiles: number;
    maxConcurrency: number;
  };
  exports: {
    directory: string;
    defaultFormat: "json" | "jsonl";
  };
};

export const pluginConfigSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    enabled: { type: "boolean" },
    storageDir: { type: "string" },
    identity: {
      type: "object",
      additionalProperties: false,
      properties: {
        mode: { type: "string", enum: ["local", "reconnect", "cloud", "shared"] },
        backendType: { type: "string", enum: ["local", "recall-http", "custom"] },
        identityKey: { type: "string" },
        apiKey: { type: "string" },
        memorySpaceId: { type: "string" },
        endpoint: { type: "string" },
        workspaceScope: { type: "string" },
        userScope: { type: "string" },
        sharedScope: { type: "string" },
        verifyOnStartup: { type: "boolean" },
      },
    },
    embedding: {
      type: "object",
      additionalProperties: false,
      properties: {
        provider: { type: "string", enum: ["local", "openai"] },
        apiKey: { type: "string" },
        model: { type: "string" },
        baseUrl: { type: "string" },
        dimensions: { type: "number" },
      },
    },
    memory: {
      type: "object",
      additionalProperties: false,
      properties: {
        autoWrite: { type: "boolean" },
        topK: { type: "number", minimum: 1, maximum: 20 },
        bootTopK: { type: "number", minimum: 1, maximum: 20 },
        maxWritesPerTurn: { type: "number", minimum: 1, maximum: 20 },
        dedupeSimilarity: { type: "number", minimum: 0, maximum: 1 },
        writeThreshold: { type: "number", minimum: 0, maximum: 20 },
        preferenceTtlDays: { type: "number", minimum: 1, maximum: 3650 },
        semanticTtlDays: { type: "number", minimum: 1, maximum: 3650 },
        episodicTtlDays: { type: "number", minimum: 1, maximum: 3650 },
        sessionStateTtlDays: { type: "number", minimum: 1, maximum: 3650 },
      },
    },
    retrieval: {
      type: "object",
      additionalProperties: false,
      properties: {
        mode: { type: "string", enum: ["keyword", "embedding", "hybrid"] },
        fallbackToKeyword: { type: "boolean" },
      },
    },
    compression: {
      type: "object",
      additionalProperties: false,
      properties: {
        recentTurns: { type: "number", minimum: 2, maximum: 20 },
        contextBudget: { type: "number", minimum: 800, maximum: 64000 },
        historySummaryThreshold: { type: "number", minimum: 4, maximum: 200 },
        toolCompactionThresholdChars: { type: "number", minimum: 100, maximum: 200000 },
      },
    },
    profile: {
      type: "object",
      additionalProperties: false,
      properties: {
        retainRuns: { type: "number", minimum: 10, maximum: 10000 },
        storeDetails: { type: "boolean" },
      },
    },
    inspect: {
      type: "object",
      additionalProperties: false,
      properties: {
        httpPath: { type: "string", default: DEFAULT_HTTP_PATH },
      },
    },
    imports: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        defaultRoots: {
          type: "array",
          items: { type: "string" },
          maxItems: 12,
        },
        maxFiles: { type: "number", minimum: 1, maximum: 5000 },
        maxConcurrency: { type: "number", minimum: 1, maximum: 16 },
      },
    },
    exports: {
      type: "object",
      additionalProperties: false,
      properties: {
        directory: { type: "string" },
        defaultFormat: { type: "string", enum: ["json", "jsonl"] },
      },
    },
  },
} as const;

export const runtimePluginConfigSchema = {
  jsonSchema: pluginConfigSchema,
  uiHints: {
    "embedding.provider": {
      label: "Embedding Provider",
      help: "Use local hashed embeddings or OpenAI-compatible embeddings.",
    },
    "embedding.apiKey": {
      label: "Embedding API Key",
      sensitive: true,
      placeholder: "sk-proj-...",
      help: "Required only for OpenAI-compatible embedding mode.",
    },
    "compression.contextBudget": {
      label: "Context Budget",
      help: "Maximum estimated tokens for injected memory and compression context.",
    },
    "memory.writeThreshold": {
      label: "Write Threshold",
      help: "Minimum importance score required before a candidate memory is persisted.",
    },
    "identity.mode": {
      label: "Identity Mode",
      help: "Use local, reconnect, cloud, or shared mode for the memory backend.",
    },
    "identity.identityKey": {
      label: "Identity Key",
      sensitive: true,
      placeholder: "recall_xxx",
      help: "Reconnects the same memory space across sessions or machines.",
    },
    "identity.apiKey": {
      label: "Memory Backend API Key",
      sensitive: true,
      placeholder: "sk-...",
      help: "Required only when your memory backend needs a remote API key.",
    },
    "identity.sharedScope": {
      label: "Shared Scope",
      placeholder: "team-alpha",
      help: "Optional shared memory scope for cross-agent or cross-machine recall.",
    },
    "retrieval.mode": {
      label: "Retrieval Mode",
      help: "Keyword, embedding, or hybrid retrieval.",
    },
    "inspect.httpPath": {
      label: "Inspect HTTP Path",
      help: "Plugin inspect route prefix. Defaults to /plugins/openclaw-recall.",
    },
    "imports.defaultRoots": {
      label: "Import Roots",
      help: "Default paths scanned by openclaw-recall import run/dry-run.",
    },
  },
  parse(value: unknown): OpenClawMemoryPluginConfig {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }
    return value as OpenClawMemoryPluginConfig;
  },
};
