import type { MemoryRecord, SessionSummary, StoredTurnProfile } from "../types/domain.js";

export function renderDashboard(params: {
  basePath: string;
  sessions: SessionSummary[];
  memories: MemoryRecord[];
  profiles: StoredTurnProfile[];
}): string {
  const sessionRows = params.sessions
    .slice(0, 8)
    .map(
      (session) =>
        `<tr><td>${escapeHtml(session.sessionId)}</td><td>${escapeHtml(session.title)}</td><td>${escapeHtml(session.preview)}</td><td>${escapeHtml(session.updatedAt)}</td></tr>`,
    )
    .join("");
  const memoryRows = params.memories
    .slice(0, 12)
    .map(
      (memory) =>
        `<tr><td>${escapeHtml(memory.kind)}</td><td>${escapeHtml(memory.summary)}</td><td>${escapeHtml(memory.retrievalReason ?? "")}</td><td>${escapeHtml(String(memory.score ?? ""))}</td></tr>`,
    )
    .join("");
  const profileRows = params.profiles
    .slice(0, 12)
    .map(
      (profile) =>
        `<tr><td>${escapeHtml(profile.runId)}</td><td>${profile.promptTokens} <code>${profile.promptTokensSource}</code></td><td>${profile.compressionSavings} <code>${profile.compressionSavingsSource}</code></td><td>${profile.retrievalCount}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OpenClaw Recall</title>
  <style>
    :root { color-scheme: light; --bg:#f3efe8; --ink:#1c1a17; --muted:#6a655d; --line:#d7cec2; --card:#fffaf3; --accent:#0e7a66; }
    body { margin:0; font-family: "Iowan Old Style", "Palatino Linotype", serif; background: radial-gradient(circle at top, #fff8ef, var(--bg)); color:var(--ink); }
    main { max-width: 1200px; margin: 0 auto; padding: 32px 24px 48px; }
    h1 { margin: 0 0 8px; font-size: 42px; }
    p { color: var(--muted); }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-top: 24px; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 18px; box-shadow: 0 18px 40px rgba(28,26,23,0.06); }
    table { width:100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 0; border-bottom: 1px solid var(--line); vertical-align: top; text-align: left; }
    th { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    code { background: rgba(14,122,102,0.08); padding: 1px 6px; border-radius: 999px; }
    .links a { margin-right: 12px; color: var(--accent); text-decoration: none; }
  </style>
</head>
<body>
  <main>
    <h1>OpenClaw Recall</h1>
    <p>Persistent memory, context compression, tool compaction, and prompt visibility for OpenClaw.</p>
    <div class="links">
      <a href="${params.basePath}/status">status</a>
      <a href="${params.basePath}/memories">memories</a>
      <a href="${params.basePath}/profiles">profiles</a>
    </div>
    <div class="grid">
      <section class="card">
        <h2>Sessions</h2>
        <table>
          <thead><tr><th>Session</th><th>Title</th><th>Preview</th><th>Updated</th></tr></thead>
          <tbody>${sessionRows || "<tr><td colspan='4'>No sessions yet.</td></tr>"}</tbody>
        </table>
      </section>
      <section class="card">
        <h2>Memories</h2>
        <table>
          <thead><tr><th>Kind</th><th>Summary</th><th>Why</th><th>Score</th></tr></thead>
          <tbody>${memoryRows || "<tr><td colspan='4'>No memories stored.</td></tr>"}</tbody>
        </table>
      </section>
      <section class="card">
        <h2>Profiles</h2>
        <table>
          <thead><tr><th>Run</th><th>Prompt</th><th>Saved</th><th>Recall</th></tr></thead>
          <tbody>${profileRows || "<tr><td colspan='4'>No profiles recorded.</td></tr>"}</tbody>
        </table>
      </section>
    </div>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
