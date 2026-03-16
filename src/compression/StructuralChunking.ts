import { sentenceFromText } from "../shared/text.js";

export type StructuredChunkKind = "paragraph" | "code_block" | "error_stack" | "list" | "command";

export interface StructuredChunk {
  kind: StructuredChunkKind;
  content: string;
}

const MAX_CHUNK_CHARS = 3000;
const MIN_CHUNK_CHARS = 40;
const IDEAL_CHUNK_CHARS = 1500;

const FENCED_CODE_RE = /^(`{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm;
const FUNC_OPEN_RE =
  /^[ \t]*(?:(?:export\s+)?(?:async\s+)?(?:function|class|const\s+\w+\s*=\s*(?:\([^)]*\)|[^=])*=>)|(?:def |class )|(?:func |fn |pub\s+fn )|(?:public |private |protected |static )+.*\{)\s*$/;
const BLOCK_CLOSE_RE = /^[ \t]*[}\]]\s*;?\s*$/;
const ERROR_STACK_RE =
  /(?:(?:Error|Exception|Traceback)[^\n]*\n(?:\s+at\s+[^\n]+\n?|.*File "[^\n]+\n?|.*line \d+[^\n]*\n?){2,})/gm;
const LIST_BLOCK_RE = /(?:^[\s]*[-*•]\s+.+\n?){3,}/gm;
const COMMAND_LINE_RE = /^(?:\$|>|#)\s+.+$/gm;

export function chunkStructuredText(text: string): StructuredChunk[] {
  let remaining = text;
  const slots: Array<{ placeholder: string; chunk: StructuredChunk }> = [];
  let counter = 0;

  function placeholder(content: string, kind: StructuredChunkKind): string {
    const tag = `\x00RECALL_SLOT_${counter++}\x00`;
    slots.push({ placeholder: tag, chunk: { content: content.trim(), kind } });
    return tag;
  }

  remaining = remaining.replace(FENCED_CODE_RE, (match) => placeholder(match, "code_block"));
  remaining = extractBraceBlocks(remaining, placeholder);

  for (const [pattern, kind] of [
    [ERROR_STACK_RE, "error_stack"],
    [LIST_BLOCK_RE, "list"],
    [COMMAND_LINE_RE, "command"],
  ] as Array<[RegExp, StructuredChunkKind]>) {
    remaining = remaining.replace(pattern, (match) => placeholder(match, kind));
  }

  const raw: StructuredChunk[] = [];
  for (const section of remaining.split(/\n{2,}/)) {
    const trimmed = section.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.includes("\x00RECALL_SLOT_")) {
      for (const part of trimmed.split(/(\x00RECALL_SLOT_\d+\x00)/)) {
        const slot = slots.find((entry) => entry.placeholder === part);
        if (slot) {
          raw.push(slot.chunk);
        } else if (part.trim().length >= MIN_CHUNK_CHARS) {
          raw.push({ content: part.trim(), kind: "paragraph" });
        }
      }
    } else if (trimmed.length >= MIN_CHUNK_CHARS) {
      raw.push({ content: trimmed, kind: "paragraph" });
    }
  }

  for (const slot of slots) {
    if (!raw.some((chunk) => chunk.content === slot.chunk.content)) {
      raw.push(slot.chunk);
    }
  }

  return splitOversized(mergeSmallChunks(raw));
}

export function prioritizeStructuredChunks(chunks: StructuredChunk[]): StructuredChunk[] {
  const priority = {
    error_stack: 5,
    command: 4,
    code_block: 3,
    list: 2,
    paragraph: 1,
  } satisfies Record<StructuredChunkKind, number>;
  return [...chunks].sort((left, right) => {
    const byKind = priority[right.kind] - priority[left.kind];
    if (byKind !== 0) {
      return byKind;
    }
    return right.content.length - left.content.length;
  });
}

export function renderStructuredChunk(chunk: StructuredChunk): string {
  if (chunk.kind === "error_stack") {
    const lines = chunk.content.split(/\r?\n/).filter(Boolean).slice(0, 3).join(" | ");
    return `Error: ${sentenceFromText(lines, 180)}`;
  }
  if (chunk.kind === "command") {
    return `Command: ${sentenceFromText(chunk.content, 180)}`;
  }
  if (chunk.kind === "code_block") {
    const lines = chunk.content.split(/\r?\n/).filter(Boolean).slice(0, 5).join(" ");
    return `Code: ${sentenceFromText(lines, 180)}`;
  }
  if (chunk.kind === "list") {
    const lines = chunk.content.split(/\r?\n/).filter(Boolean).slice(0, 3).join(" | ");
    return `List: ${sentenceFromText(lines, 180)}`;
  }
  return `Fact: ${sentenceFromText(chunk.content, 180)}`;
}

function extractBraceBlocks(
  text: string,
  placeholder: (content: string, kind: StructuredChunkKind) => string,
): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let blockLines: string[] = [];
  let depth = 0;
  let inBlock = false;

  for (const line of lines) {
    if (line.includes("\x00RECALL_SLOT_")) {
      if (inBlock) {
        blockLines.push(line);
      } else {
        result.push(line);
      }
      continue;
    }

    if (!inBlock && FUNC_OPEN_RE.test(line)) {
      inBlock = true;
      blockLines = [line];
      depth = Math.max(1, countBraces(line));
      continue;
    }

    if (inBlock) {
      blockLines.push(line);
      depth += countBraces(line);
      if (depth <= 0 || (BLOCK_CLOSE_RE.test(line) && depth <= 0)) {
        const block = blockLines.join("\n");
        result.push(block.trim().length >= MIN_CHUNK_CHARS ? placeholder(block, "code_block") : block);
        inBlock = false;
        blockLines = [];
        depth = 0;
      }
    } else {
      result.push(line);
    }
  }

  if (blockLines.length > 0) {
    const block = blockLines.join("\n");
    result.push(block.trim().length >= MIN_CHUNK_CHARS ? placeholder(block, "code_block") : block);
  }

  return result.join("\n");
}

function countBraces(line: string): number {
  let delta = 0;
  for (const ch of line) {
    if (ch === "{" || ch === "(") delta += 1;
    if (ch === "}" || ch === ")") delta -= 1;
  }
  return delta;
}

function mergeSmallChunks(chunks: StructuredChunk[]): StructuredChunk[] {
  if (chunks.length <= 1) {
    return chunks;
  }
  const merged: StructuredChunk[] = [];
  let buffer: StructuredChunk | null = null;

  for (const chunk of chunks) {
    if (!buffer) {
      buffer = { ...chunk };
      continue;
    }

    const sameKind = buffer.kind === chunk.kind;
    const bothSmall = buffer.content.length < IDEAL_CHUNK_CHARS && chunk.content.length < IDEAL_CHUNK_CHARS;
    const mergedLength = buffer.content.length + chunk.content.length + 2;
    if (sameKind && bothSmall && mergedLength <= MAX_CHUNK_CHARS) {
      buffer.content = `${buffer.content}\n\n${chunk.content}`;
    } else {
      merged.push(buffer);
      buffer = { ...chunk };
    }
  }

  if (buffer) {
    merged.push(buffer);
  }
  return merged;
}

function splitOversized(chunks: StructuredChunk[]): StructuredChunk[] {
  const result: StructuredChunk[] = [];
  for (const chunk of chunks) {
    if (chunk.content.length <= MAX_CHUNK_CHARS || chunk.kind === "code_block") {
      result.push(chunk);
      continue;
    }
    result.push(...splitAtSentenceBoundary(chunk.content, chunk.kind));
  }
  return result;
}

function splitAtSentenceBoundary(text: string, kind: StructuredChunkKind): StructuredChunk[] {
  const sentences = text.match(/[^.!?。！？\n]+(?:[.!?。！？]+|\n{2,})/g) ?? [text];
  const result: StructuredChunk[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    if (buffer.length + sentence.length > MAX_CHUNK_CHARS && buffer.length > 0) {
      result.push({ content: buffer.trim(), kind });
      buffer = "";
    }
    buffer += sentence;
  }
  if (buffer.trim().length >= MIN_CHUNK_CHARS) {
    result.push({ content: buffer.trim(), kind });
  }
  return result;
}
