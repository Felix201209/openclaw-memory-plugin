import { cosineSimilarity, EmbeddingProvider } from "./EmbeddingProvider.js";
import { MemoryStore } from "./MemoryStore.js";
import { MemoryRanker } from "./MemoryRanker.js";
import { MemoryRecord, RetrievalMode } from "../types/domain.js";
import { sanitizeIncomingUserText } from "../shared/safety.js";
import type { ResolvedPluginConfig } from "../config/schema.js";
import { isMemoryVisible } from "./scopes.js";
import { explainSuppression } from "./MemoryRanker.js";
import { effectiveImportance, explainLifecycleSuppression, isRetrievalEligible, lifecycleState } from "./hygiene.js";

export class MemoryRetriever {
  constructor(
    private readonly store: MemoryStore,
    private readonly ranker: MemoryRanker,
    private readonly embeddings: EmbeddingProvider,
    private readonly bootTopK: number,
    private readonly config: ResolvedPluginConfig,
  ) {}

  async retrieve(query: string, limit: number, options: { sessionId?: string } = {}): Promise<MemoryRecord[]> {
    const result = await this.retrieveWithContext(query, limit, options);
    return result.memories;
  }

  async retrieveWithContext(
    query: string,
    limit: number,
    options: { sessionId?: string } = {},
  ): Promise<{
    memories: MemoryRecord[];
    mode: RetrievalMode;
    keywordContribution: number;
    semanticContribution: number;
  }> {
    const cleanQuery = sanitizeIncomingUserText(query);
    const usedMode = this.resolveRetrievalMode();
    const memories = (await this.store.search(cleanQuery)).filter((memory) =>
      isMemoryVisible(memory, this.config, options.sessionId),
    );
    const queryEmbedding = usedMode === "keyword" ? [] : await this.embeddings.embed(cleanQuery);
    const candidatePoolSize = Math.max(limit * 4, this.bootTopK * 2, 8);
    const ranked = this.ranker.rank(cleanQuery, memories, queryEmbedding, usedMode).slice(0, candidatePoolSize);
    const boot = options.sessionId
      ? await this.store.listBootCandidates(
          options.sessionId,
          Math.min(limit, Math.max(2, this.bootTopK)),
        )
      : [];
    const visibleBoot = boot.filter((memory) => isMemoryVisible(memory, this.config, options.sessionId));
    const merged = this.mergeCandidates(cleanQuery, ranked, visibleBoot);
    const selected = this.diversifyCandidates(cleanQuery, merged, limit);
    await this.store.touch(selected);
    return {
      memories: selected,
      mode: usedMode,
      keywordContribution: selected.reduce(
        (sum, memory) => sum + (memory.scoreBreakdown?.keywordContribution ?? 0),
        0,
      ),
      semanticContribution: selected.reduce(
        (sum, memory) => sum + (memory.scoreBreakdown?.semanticContribution ?? 0),
        0,
      ),
    };
  }

  async explain(query: string, limit: number, options: { sessionId?: string } = {}): Promise<MemoryRecord[]> {
    return (await this.retrieveWithContext(query, limit, options)).memories;
  }

  async explainDetailed(
    query: string,
    limit: number,
    options: { sessionId?: string } = {},
  ): Promise<{
    query: string;
    retrievalMode: RetrievalMode;
    selected: MemoryRecord[];
    suppressed: Array<{ id: string; summary: string; reasons: string[] }>;
    keywordContribution: number;
    semanticContribution: number;
  }> {
    const cleanQuery = sanitizeIncomingUserText(query);
    const usedMode = this.resolveRetrievalMode();
    const all = (await this.store.listAll()).filter((memory) =>
      isMemoryVisible(memory, this.config, options.sessionId),
    );
    const suppressed = all
      .map((memory) => ({
        memory,
        reasons: Array.from(
          new Set([
            ...explainSuppression(memory),
            ...explainLifecycleSuppression(memory),
            ...(isRetrievalEligible(memory) ? [] : ["retrieval-ineligible"]),
          ]),
        ),
      }))
      .filter((entry) => entry.reasons.length > 0)
      .map((entry) => ({
        id: entry.memory.id,
        summary: entry.memory.summary,
        lifecycle: lifecycleState(entry.memory),
        effectiveImportance: effectiveImportance(entry.memory),
        reasons: entry.reasons,
      }));
    const selected = (await this.retrieveWithContext(cleanQuery, limit, options));
    const selectedWithBreakdown = selected.memories.map((memory) =>
      memory.scoreBreakdown
        ? memory
        : {
            ...memory,
            scoreBreakdown: {
              retrievalMode: usedMode,
              semanticSimilarity: 0,
              semanticContribution: 0,
              keywordContribution: 0,
              salience: memory.salience,
              recency: 0,
              confidence: memory.confidence ?? 0,
              typeWeight: 0,
              overlap: 0,
              redundancyPenalty: 0,
              finalScore: memory.score ?? memory.salience,
            },
          },
    );
    return {
      query: cleanQuery,
      retrievalMode: usedMode,
      selected: selectedWithBreakdown,
      suppressed,
      keywordContribution: selected.keywordContribution,
      semanticContribution: selected.semanticContribution,
    };
  }

  embeddingAvailability(): "exact" | "local" | "unavailable" {
    return this.embeddings.availability;
  }

  previewMode(): RetrievalMode {
    return this.resolveRetrievalMode();
  }

  private resolveRetrievalMode(): RetrievalMode {
    if (this.config.retrieval.mode === "keyword") {
      return "keyword";
    }
    if (this.config.retrieval.mode === "embedding") {
      if (this.embeddings.available) {
        return "embedding";
      }
      return this.config.retrieval.fallbackToKeyword ? "keyword" : "embedding";
    }
    if (this.embeddings.available) {
      return "hybrid";
    }
    return this.config.retrieval.fallbackToKeyword ? "keyword" : "embedding";
  }

  private mergeCandidates(query: string, ranked: MemoryRecord[], boot: MemoryRecord[]): MemoryRecord[] {
    const merged = new Map<string, MemoryRecord>();
    for (const memory of [...ranked, ...boot]) {
      const current = merged.get(memory.id);
      if (!current || this.candidatePriority(query, memory) > this.candidatePriority(query, current)) {
        merged.set(memory.id, memory);
      }
    }
    return [...merged.values()].sort((left, right) => this.candidatePriority(query, right) - this.candidatePriority(query, left));
  }

  private diversifyCandidates(query: string, candidates: MemoryRecord[], limit: number): MemoryRecord[] {
    if (candidates.length <= limit) {
      return candidates.slice(0, limit);
    }

    const recallIntent = /记得|remember|偏好|preference|项目|project|focus|重点|继续/i.test(query);
    const lambda = recallIntent ? 0.82 : 0.74;
    const pool = candidates.slice(0, Math.max(limit * 4, Math.min(12, candidates.length)));
    const maxPriority = Math.max(...pool.map((memory) => this.candidatePriority(query, memory)), 1);
    const selected: MemoryRecord[] = [];
    const remaining = [...pool];

    while (selected.length < limit && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index];
        const relevance = this.candidatePriority(query, candidate) / maxPriority;
        const redundancy = selected.length === 0
          ? 0
          : Math.max(...selected.map((picked) => this.memorySimilarity(candidate, picked)));
        const mmrScore = lambda * relevance - (1 - lambda) * redundancy;
        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = index;
        }
      }

      selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    return selected;
  }

  private candidatePriority(query: string, memory: MemoryRecord): number {
    const base =
      memory.score ??
      (memory.scoreBreakdown?.finalScore ?? 0) +
        effectiveImportance(memory) * 0.45 +
        (memory.kind === "preference" ? 2.2 : memory.kind === "semantic" ? 1.5 : 0.4);
    const recallIntent = /记得|remember|偏好|preference|项目|project|focus|重点|继续/i.test(query);
    const recallBoost =
      recallIntent && memory.kind === "preference"
        ? 3.2
        : recallIntent && memory.kind === "semantic"
          ? 2.4
          : recallIntent && memory.kind === "session_state"
            ? 0.8
            : 0;
    const scopeBoost =
      memory.scope === "private"
        ? 0.8
        : memory.scope === "workspace"
          ? 0.55
          : memory.scope === "shared"
            ? 0.3
            : 0;
    return base + recallBoost + scopeBoost;
  }

  private memorySimilarity(left: MemoryRecord, right: MemoryRecord): number {
    const embeddingSimilarity =
      left.embedding?.length && right.embedding?.length
        ? Math.max(0, cosineSimilarity(left.embedding, right.embedding))
        : 0;
    const leftTopics = new Set(left.topics.map((topic) => topic.toLowerCase()));
    const rightTopics = new Set(right.topics.map((topic) => topic.toLowerCase()));
    const overlap = [...leftTopics].filter((topic) => rightTopics.has(topic)).length;
    const union = new Set([...leftTopics, ...rightTopics]).size || 1;
    const topicSimilarity = overlap / union;
    const sameGroup = left.memoryGroup && right.memoryGroup && left.memoryGroup === right.memoryGroup ? 1 : 0;
    const sameSummary = left.summary.trim().toLowerCase() === right.summary.trim().toLowerCase() ? 1 : 0;
    const sameKind = left.kind === right.kind ? 1 : 0;
    return Math.max(embeddingSimilarity, topicSimilarity, sameGroup, sameSummary, sameKind);
  }
}
