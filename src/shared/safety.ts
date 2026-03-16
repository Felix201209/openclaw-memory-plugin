import type { ChatTurn, MemoryRecord } from "../types/domain.js";

const SCAFFOLD_LABELS = [
  "TASK STATE",
  "RELEVANT MEMORY",
  "COMPRESSED TOOL OUTPUT",
  "OLDER HISTORY SUMMARY",
  "RECENT TURNS",
  "CURRENT USER MESSAGE",
];

const metadataPatterns = [
  /sender \(untrusted metadata\)/i,
  /openclaw-control-ui/i,
  /\bcontrol-ui\b/i,
  /\bcron:[a-f0-9-]{8,}\b/i,
  /\bheartbeat\b/i,
  /\bcron job\b/i,
  /plugins\.allow is empty/i,
  /transport metadata/i,
  /\btransport\b.*\bwrapper\b/i,
  /"label"\s*:/i,
  /"id"\s*:/i,
  /"sender"\s*:/i,
  /"transport"\s*:/i,
  /current time:/i,
  /\bGMT[+-]?\d+\b/i,
  /\bUTC[+-]?\d+\b/i,
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i,
  /\bmessageprovider\b/i,
  /\bchannelid\b/i,
  /\bworkspaceDir\b/i,
  /\bsessionKey\b/i,
  /\btrace(id)?\b/i,
  /\bdebug\b annotation/i,
  /\bprovider trace\b/i,
  /\braw payload\b/i,
  /\bfunction[_ -]?call\b/i,
  /\btool result\b.*\bjson\b/i,
  /\bopenclaw-engram\b/i,
];

const profanityPattern = /傻逼|傻b|傻x|垃圾|他妈|妈的|蠢货|fuck|shit|idiot|stupid/i;
const stablePreferencePattern =
  /偏直接|直接给结果|执行导向|可执行|结构化输出|结构化汇报|结论.{0,8}进度.{0,8}风险.{0,8}下一步|已完成.{0,8}未完成.{0,8}下一步|不喜欢空话|模板废话|简洁|中文回答|prefer|preference|喜欢|不喜欢|希望|默认|别再/i;
const assistantNoisePattern =
  /你说得对|抱歉|如果你愿意|你回我一句|我后面默认按这个格式回你|我现在\*\*只说我能确定的偏好|已完成\s*\/\s*未完成\s*\/\s*下一步/i;
const outputLeakagePattern =
  /(?:^|\n)\s*(?:TASK STATE|RELEVANT MEMORY|COMPRESSED TOOL OUTPUT|OLDER HISTORY SUMMARY|RECENT TURNS|CURRENT USER MESSAGE)\s*(?:\n|$)|<(?:task_state|relevant_memory|compacted_tool_output|older_history_summary|recent_turns)>|(?:score|importance|confidence|why)\s*[:=]/i;
const sensitivePatterns = [
  /\bsk-[a-z0-9_-]{12,}\b/i,
  /\bghp_[a-z0-9]{20,}\b/i,
  /\bAIza[0-9A-Za-z\-_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bapi[_ -]?key\b/i,
  /\bsecret\b/i,
  /\baccess[_ -]?token\b/i,
  /\brefresh[_ -]?token\b/i,
  /\bpassword\b/i,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
];

function collapse(text: string): string {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function containsInternalScaffold(text: string): boolean {
  return (
    SCAFFOLD_LABELS.some((label) => new RegExp(`(^|\\n|\\s)${label}(?::|\\n|$)`, "i").test(text)) ||
    /<task_state>|<relevant_memory>|<compacted_tool_output>|<older_history_summary>|<recent_turns>/i.test(text)
  );
}

export function stripTransportNoise(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/^\s*Sender \(untrusted metadata\):.*$/gim, "");
  cleaned = cleaned.replace(/Sender \(untrusted metadata\):[\s\S]*?```[\s\S]*?```\s*/gi, "");
  cleaned = cleaned.replace(/^\s*(?:transport|wrapper|provider trace|raw payload|debug annotation)\s*:\s*.*$/gim, "");
  cleaned = cleaned.replace(/^\s*\[[^\]]*(?:heartbeat|cron|transport|provider)[^\]]*\]\s*$/gim, "");
  cleaned = cleaned.replace(/^\s*\{?\s*"label"\s*:\s*"[^"]*"\s*,?\s*"id"\s*:\s*"[^"]*"\s*\}?\s*$/gim, "");
  cleaned = cleaned.replace(/^\s*\{?\s*"sender"\s*:\s*"[^"]*".*$/gim, "");
  cleaned = cleaned.replace(/\[[A-Z][a-z]{2} [^\]]*GMT[^\]]*\]\s*/g, "");
  cleaned = cleaned.replace(/\b(openclaw-control-ui|control-ui)\b/gi, "");
  return collapse(cleaned);
}

export function stripInternalScaffold(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(
    /<task_state>[\s\S]*?<\/task_state>|<relevant_memory>[\s\S]*?<\/relevant_memory>|<compacted_tool_output>[\s\S]*?<\/compacted_tool_output>|<older_history_summary>[\s\S]*?<\/older_history_summary>|<recent_turns>[\s\S]*?<\/recent_turns>/gi,
    "",
  );
  for (const label of SCAFFOLD_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(
      new RegExp(`(^|\\n)${escaped}\\n[\\s\\S]*?(?=\\n(?:${SCAFFOLD_LABELS.map((entry) => entry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\n|$)`, "gi"),
      "\n",
    );
    cleaned = cleaned.replace(new RegExp(`${escaped}\\s*:?\\s*[^\\n]*`, "gi"), "");
  }
  return collapse(cleaned);
}

export function sanitizeIncomingUserText(text: string): string {
  return collapse(stripInternalScaffold(stripTransportNoise(text)));
}

export function sanitizeAssistantOutput(text: string): string {
  const stripped = collapse(stripTransportNoise(stripInternalScaffold(text)));
  const normalized = stripped
    .replace(/•\s*\[(?:preference|semantic|session_state|episodic)\]\s*/gi, "- ")
    .replace(/\s*\((?:score|importance|why)[^)]*\)/gi, "")
    .replace(/(?:^|\n)\s*(?:score|importance|confidence|why)\s*[:=].*$/gim, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !isNoiseLikeText(line))
    .join("\n");

  const cleaned = collapse(normalized);
  if (cleaned && !containsInternalScaffold(cleaned) && !outputLeakagePattern.test(cleaned)) {
    return cleaned;
  }

  const fallbackBullets = Array.from(
    new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^[-•]/.test(line) || /\[(?:preference|semantic)\]/i.test(line))
        .map((line) => line.replace(/^[-•]\s*/, "").replace(/\[(?:preference|semantic|session_state|episodic)\]\s*/gi, "").replace(/\s*\((?:score|importance|why)[^)]*\)/gi, "").trim())
        .filter((line) => line && !isNoiseLikeText(line)),
    ),
  ).slice(0, 3);

  if (fallbackBullets.length > 0) {
    return `我记得这些稳定偏好：${fallbackBullets.join("；")}`;
  }

  return "我会直接回答你的问题，只给出对你有用的结论。";
}

export function isNoiseLikeText(text: string): boolean {
  const cleaned = collapse(stripTransportNoise(stripInternalScaffold(text)));
  if (!cleaned) {
    return true;
  }
  if (metadataPatterns.some((pattern) => pattern.test(text) || pattern.test(cleaned))) {
    return true;
  }
  if (/^(?:tool|debug|trace|transport|wrapper)\b[:：-]/i.test(cleaned)) {
    return true;
  }
  return false;
}

export function isLowValueEmotionalText(text: string): boolean {
  const cleaned = collapse(stripTransportNoise(text));
  return profanityPattern.test(cleaned) && !stablePreferencePattern.test(cleaned) && cleaned.length < 200;
}

export function shouldRejectMemoryCandidate(
  turn: Pick<ChatTurn, "role">,
  candidate: Pick<MemoryRecord, "kind" | "summary" | "content">,
): boolean {
  const combined = `${candidate.summary}\n${candidate.content}`;
  if (isNoiseLikeText(combined) || containsInternalScaffold(combined) || isLowValueEmotionalText(combined)) {
    return true;
  }
  if (turn.role === "assistant" && candidate.kind === "session_state") {
    return true;
  }
  return false;
}

export function shouldSuppressMemory(memory: Pick<MemoryRecord, "summary" | "content" | "kind" | "active">): boolean {
  if (memory.active === false) {
    return true;
  }
  const combined = `${memory.summary}\n${memory.content}`;
  if (isNoiseLikeText(combined) || containsInternalScaffold(combined) || isLowValueEmotionalText(combined)) {
    return true;
  }
  if (
    memory.kind === "session_state" &&
    /sender|cron|heartbeat|control-ui|untrusted metadata|plugins\.allow/i.test(combined)
  ) {
    return true;
  }
  if (memory.kind === "session_state" && assistantNoisePattern.test(combined)) {
    return true;
  }
  return false;
}

export function sanitizeTurnForStorage(turn: ChatTurn, originalPrompt?: string): ChatTurn {
  if (turn.role === "assistant") {
    return { ...turn, text: sanitizeAssistantOutput(turn.text) };
  }
  if (turn.role === "user") {
    const cleaned = sanitizeIncomingUserText(turn.text);
    return { ...turn, text: cleaned || originalPrompt?.trim() || turn.text.trim() };
  }
  return { ...turn, text: collapse(stripTransportNoise(turn.text)) };
}

export function hasStablePreferenceSignal(text: string): boolean {
  return stablePreferencePattern.test(stripTransportNoise(text));
}

export function containsSensitiveText(text: string): boolean {
  const cleaned = collapse(text);
  return sensitivePatterns.some((pattern) => pattern.test(cleaned));
}

export function explainSuppressedMemory(text: string): string[] {
  const cleaned = collapse(stripTransportNoise(stripInternalScaffold(text)));
  const reasons: string[] = [];
  if (!cleaned) {
    reasons.push("empty-after-sanitization");
  }
  if (containsInternalScaffold(text)) {
    reasons.push("internal-scaffold");
  }
  if (metadataPatterns.some((pattern) => pattern.test(text) || pattern.test(cleaned))) {
    reasons.push("metadata-or-system-noise");
  }
  if (isLowValueEmotionalText(text)) {
    reasons.push("low-value-emotional-text");
  }
  if (/^(?:tool|debug|trace|transport|wrapper)\b[:：-]/i.test(cleaned)) {
    reasons.push("wrapper-or-debug-prefix");
  }
  return Array.from(new Set(reasons));
}
