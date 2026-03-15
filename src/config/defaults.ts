export const DEFAULT_PLUGIN_ID = "openclaw-recall";
export const DEFAULT_HTTP_PATH = "/plugins/openclaw-recall";

export const defaultPluginConfig = {
  enabled: true,
  embedding: {
    provider: "local" as const,
    model: "text-embedding-3-small",
    baseUrl: "https://api.openai.com/v1",
    dimensions: 256,
  },
  memory: {
    autoWrite: true,
    topK: 6,
    bootTopK: 4,
    maxWritesPerTurn: 6,
    dedupeSimilarity: 0.92,
    writeThreshold: 5.2,
    preferenceTtlDays: 180,
    semanticTtlDays: 120,
    episodicTtlDays: 14,
    sessionStateTtlDays: 21,
  },
  compression: {
    recentTurns: 6,
    contextBudget: 2400,
    historySummaryThreshold: 6,
    toolCompactionThresholdChars: 600,
  },
  profile: {
    retainRuns: 500,
    storeDetails: true,
  },
  inspect: {
    httpPath: DEFAULT_HTTP_PATH,
  },
};

export function buildDefaultPluginEntry() {
  return {
    enabled: true,
    hooks: {
      allowPromptInjection: true,
    },
    config: {
      memory: defaultPluginConfig.memory,
      compression: defaultPluginConfig.compression,
      profile: defaultPluginConfig.profile,
      inspect: defaultPluginConfig.inspect,
      embedding: {
        provider: defaultPluginConfig.embedding.provider,
        model: defaultPluginConfig.embedding.model,
        baseUrl: defaultPluginConfig.embedding.baseUrl,
        dimensions: defaultPluginConfig.embedding.dimensions,
      },
    },
  };
}
