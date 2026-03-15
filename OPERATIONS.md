# Operations

## Quick checks

```bash
openclaw-recall doctor
openclaw-recall status
openclaw-recall memory list
openclaw-recall profile list
```

## What `doctor` checks

- OpenClaw config presence
- plugin enablement
- database path, writability, and SQLite query health
- embedding availability
- inspect route path
- package and plugin manifest integrity
- build integrity
- env/config precedence warnings
- recent hook activity
- memory pipeline activity
- retrieval pipeline activity
- compression pipeline activity
- recent tool compaction evidence
- recent profile path integrity

## Debugging memory behavior

```bash
openclaw-recall memory search "concise chinese replies"
openclaw-recall memory explain "你记得我的偏好吗？"
openclaw-recall memory inspect <id>
openclaw-recall session inspect <sessionId>
```

## Debugging profile and compression behavior

```bash
openclaw-recall profile list
openclaw-recall profile inspect <runId>
```

Look for:

- `promptTokens`
- `promptTokensSource`
- `memoryInjected`
- `toolTokensSaved`
- `toolTokensSavedSource`
- `compressionSavings`
- `compressionSavingsSource`
- `retrievalCount`

If `promptTokensSource=exact`, the provider reported real usage. Savings values may still remain `estimated`.

## Inspect HTTP surface

Use the authenticated OpenClaw route:

- `/plugins/openclaw-recall/dashboard`
- `/plugins/openclaw-recall/status`
- `/plugins/openclaw-recall/sessions/:sessionId`

## Recovery

### Disable the plugin temporarily

```bash
openclaw plugins disable openclaw-recall
```

### Disable automatic memory writes only

```bash
OPENCLAW_RECALL_AUTO_WRITE=false
```

### Re-enable

```bash
openclaw plugins enable openclaw-recall
```

### Remove plugin state only

Delete:

```text
$OPENCLAW_HOME/.openclaw/plugins/openclaw-recall/
```

This clears stored memories, profiles, and tool compactions for the plugin only.

### Export debug evidence

```bash
openclaw-recall doctor --json > doctor.json
openclaw-recall status --json > status.json
openclaw-recall session inspect <sessionId> --json > session.json
openclaw-recall profile inspect <runId> --json > profile.json
```

## SQLite notes

The plugin uses SQLite with:

- `foreign_keys = ON`
- `busy_timeout = 5000`
- `journal_mode = WAL` when available

If another long-running process is holding the database, operator commands should wait briefly instead of failing immediately.
