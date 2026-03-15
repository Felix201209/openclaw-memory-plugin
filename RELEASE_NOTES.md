# Release Notes

## OpenClaw Recall v1.0.0

OpenClaw Recall is the first stable release of the plugin formerly developed as `openclaw-memory-plugin`.

### What it is

An OpenClaw enhancement plugin that adds persistent memory, context compression, tool output compaction, and inspectable profiling without replacing OpenClaw itself.

### Why you would install it

- stable preferences survive across sessions
- prompt construction wastes fewer tokens
- large tool payloads stop bloating the prompt path
- memory and compression behavior become inspectable

### Core capabilities

- automatic memory write for `preference`, `semantic`, `episodic`, and `session_state`
- cross-session memory retrieval before prompt build
- layered context compression with budget enforcement
- tool output compaction with saved-token reporting
- operator CLI for doctor, status, memory, profile, session, and config inspection
- plugin inspect routes inside OpenClaw

### Install

```bash
npm install openclaw-recall
openclaw plugins install --link ./node_modules/openclaw-recall
openclaw plugins info openclaw-recall
openclaw-recall doctor
openclaw-recall status
```

### Compatibility

- verified OpenClaw target: `>=2026.3.13`
- verified Node versions: `24.10.0`, `24.12.0`
- strongest validated provider path: `openai-responses`

### Known limitations

- `compressionSavings` and `toolTokensSaved` remain partly `estimated`
- OpenClaw plugin CLI exposure through `openclaw <subcommand>` is still upstream-limited; use `openclaw-recall`
- OpenAI-compatible embeddings are supported but not covered by the strongest smoke path
- some OpenClaw install/info flows may emit `plugins.allow is empty` warning noise
- memory conflict resolution remains rule-based
