const SKIP_PATTERNS = [
  /^(hi|hello|hey|good\s*(morning|afternoon|evening|night)|greetings|yo|sup|howdy|what'?s up)\b/i,
  /^\//,
  /^(run|build|test|ls|cd|git|npm|pnpm|yarn|pip|docker|curl|cat|grep|find|make|sudo)\b/i,
  /^(yes|no|yep|nope|ok|okay|sure|fine|thanks|thank you|thx|ty|got it|understood|cool|nice|great|good|perfect|awesome)\s*[.!]?$/i,
  /^(go ahead|continue|proceed|do it|start|begin|next|实施|開始|开始|继续|繼續|好的|可以|行)\s*[.!]?$/i,
  /^[\p{Emoji}\s]+$/u,
  /HEARTBEAT/i,
  /^\[System/i,
  /^(ping|pong|test|debug)\s*[.!?]?$/i,
];

const FORCE_RETRIEVE_PATTERNS = [
  /\b(remember|recall|forgot|memory|memories)\b/i,
  /\b(last time|before|previously|earlier|yesterday|ago)\b/i,
  /\b(my (name|email|phone|address|birthday|preference|preferences))\b/i,
  /\b(what did (i|we)|did i (tell|say|mention))\b/i,
  /(你记得|[你妳]記得|之前|上次|以前|还记得|還記得|提到过|提到過|说过|說過|偏好|项目重点|項目重點)/i,
];

export function normalizeRetrievalQuery(query: string): string {
  let text = query.trim();
  text = text.replace(/^(Conversation info|Sender) \(untrusted metadata\):[\s\S]*?\n\s*\n/gim, "");
  text = text.replace(/^\[cron:[^\]]+\]\s*/i, "");
  text = text.replace(/^\[[A-Za-z]{3}\s\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\s[^\]]+\]\s*/, "");
  return text.trim();
}

export function shouldSkipAutoRetrieval(query: string, minLength?: number): boolean {
  const trimmed = normalizeRetrievalQuery(query);

  if (!trimmed) {
    return true;
  }

  if (FORCE_RETRIEVE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  if (trimmed.length < 5) {
    return true;
  }

  if (SKIP_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  if (typeof minLength === "number" && minLength > 0) {
    return trimmed.length < minLength && !/[?？]/.test(trimmed);
  }

  const hasCjk = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(trimmed);
  const defaultMinLength = hasCjk ? 6 : 15;
  return trimmed.length < defaultMinLength && !/[?？]/.test(trimmed);
}
