import type { ResolvedPluginConfig } from "../config/schema.js";
import { tokenize } from "../shared/text.js";

export interface EmbeddingProvider {
  readonly providerId: "local" | "openai";
  readonly dimensions: number;
  readonly available: boolean;
  readonly availability: "exact" | "local" | "unavailable";
  embed(text: string): Promise<number[]>;
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => value / magnitude);
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly providerId = "local" as const;
  readonly available = true;
  readonly availability = "local" as const;

  constructor(readonly dimensions: number) {}

  async embed(text: string): Promise<number[]> {
    const vector = Array.from({ length: this.dimensions }, () => 0);
    for (const token of tokenize(text)) {
      const idx = hashToken(token) % this.dimensions;
      vector[idx] += 1;
    }
    return normalizeVector(vector);
  }
}

class OpenAiCompatibleEmbeddingProvider implements EmbeddingProvider {
  readonly providerId = "openai" as const;
  readonly available = true;
  readonly availability = "exact" as const;

  constructor(
    readonly dimensions: number,
    private readonly model: string,
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.openai.com/v1",
  ) {}

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };

    return normalizeVector(payload.data?.[0]?.embedding ?? []);
  }
}

class UnavailableEmbeddingProvider implements EmbeddingProvider {
  readonly providerId = "openai" as const;
  readonly available = false;
  readonly availability = "unavailable" as const;

  constructor(readonly dimensions: number) {}

  async embed(): Promise<number[]> {
    return [];
  }
}

export function createEmbeddingProvider(config: ResolvedPluginConfig): EmbeddingProvider {
  if (config.embedding.provider === "openai") {
    if (!config.embedding.apiKey?.trim()) {
      return new UnavailableEmbeddingProvider(config.embedding.dimensions);
    }
    return new OpenAiCompatibleEmbeddingProvider(
      config.embedding.dimensions,
      config.embedding.model,
      config.embedding.apiKey,
      config.embedding.baseUrl,
    );
  }

  return new LocalEmbeddingProvider(config.embedding.dimensions);
}

export function cosineSimilarity(left: number[] = [], right: number[] = []): number {
  if (left.length === 0 || right.length === 0) return 0;
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
