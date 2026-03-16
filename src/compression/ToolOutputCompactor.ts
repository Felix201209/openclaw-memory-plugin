import { estimateTokens, sentenceFromText } from "../shared/text.js";
import { CompactedToolResult } from "../types/domain.js";
import { chunkStructuredText, prioritizeStructuredChunks, renderStructuredChunk } from "./StructuralChunking.js";

export class ToolOutputCompactor {
  constructor(private readonly thresholdChars = 600) {}

  compact(toolName: string, payload: unknown): CompactedToolResult {
    const serialized = serializePayload(payload);
    const originalEstimatedTokens = estimateTokens(serialized);
    if (serialized.length < this.thresholdChars) {
      const compacted = [`Tool: ${toolName}`, `Summary: ${sentenceFromText(serialized, 240)}`].join("\n");
      return {
        toolName,
        compacted,
        estimatedTokens: estimateTokens(compacted),
        originalEstimatedTokens,
        savedTokens: Math.max(0, originalEstimatedTokens - estimateTokens(compacted)),
      };
    }
    const compacted = this.renderPayload(toolName, payload);
    const estimatedTokens = estimateTokens(compacted);
    return {
      toolName,
      compacted,
      estimatedTokens,
      originalEstimatedTokens,
      savedTokens: Math.max(0, originalEstimatedTokens - estimatedTokens),
    };
  }

  private renderPayload(toolName: string, payload: unknown): string {
    if (typeof payload === "string") {
      return this.renderStructuredText(toolName, payload);
    }

    if (Array.isArray(payload)) {
      const lines = payload
        .slice(0, 6)
        .map((entry, index) => {
          const rendered = JSON.stringify(entry) ?? String(entry ?? "");
          return `${index + 1}. ${sentenceFromText(rendered, 140)}`;
        })
        .join("\n");
      const structured = this.renderStructuredText(toolName, JSON.stringify(payload, null, 2) ?? String(payload));
      return [structured, lines ? `Items:\n${lines}` : ""].filter(Boolean).join("\n");
    }

    if (payload && typeof payload === "object") {
      const entries = Object.entries(payload as Record<string, unknown>)
        .slice(0, 8)
        .map(([key, value]) => {
          const rendered = JSON.stringify(value) ?? String(value ?? "");
          return `${key}: ${sentenceFromText(rendered, 120)}`;
        })
        .join("\n");
      const structured = this.renderStructuredText(toolName, JSON.stringify(payload, null, 2) ?? String(payload));
      return [structured, entries ? `Key facts:\n${entries}` : ""].filter(Boolean).join("\n");
    }

    return [`Tool: ${toolName}`, `Summary: ${sentenceFromText(String(payload ?? ""), 240)}`].join("\n");
  }

  private renderStructuredText(toolName: string, text: string): string {
    const chunks = prioritizeStructuredChunks(chunkStructuredText(text)).slice(0, 6);
    const lines = chunks.map((chunk, index) => `${index + 1}. ${renderStructuredChunk(chunk)}`).join("\n");
    return [`Tool: ${toolName}`, `Summary: ${sentenceFromText(text, 180)}`, lines ? `Key facts:\n${lines}` : ""]
      .filter(Boolean)
      .join("\n");
  }
}

function serializePayload(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }
  try {
    return JSON.stringify(payload ?? null, null, 2) ?? String(payload ?? "");
  } catch {
    return String(payload ?? "");
  }
}
