# OpenClaw Integration

## Integration shape

OpenClaw Recall integrates as a normal OpenClaw plugin package. It does not patch OpenClaw source files and does not require modifying the installed OpenClaw package.

Primary install method:

- `openclaw plugins install --link /path/to/openclaw-recall`

## Install flow

### Source checkout

```bash
cd /path/to/openclaw-recall
npm install
npm run build
openclaw plugins install --link .
```

### Installed package path

```bash
npm install openclaw-recall
openclaw plugins install --link ./node_modules/openclaw-recall
```

### Verify discovery

```bash
openclaw plugins info openclaw-recall
openclaw plugins doctor
openclaw-recall doctor
openclaw-recall status
```

## Config path and state path

If `OPENCLAW_HOME=/path/root`, OpenClaw uses:

```text
/path/root/.openclaw/openclaw.json
```

OpenClaw Recall stores its runtime data under:

```text
/path/root/.openclaw/plugins/openclaw-recall/
```

## Config precedence

Resolution order:

1. environment variables `OPENCLAW_RECALL_*`
2. `plugins.entries.openclaw-recall.config`
3. defaults from `src/config/defaults.ts`

Legacy `OPENCLAW_MEMORY_PLUGIN_*` variables are still accepted as compatibility aliases during the rename transition.

Starter entry helpers:

```bash
openclaw-recall config init
openclaw-recall config init --write-openclaw
openclaw-recall config validate
```

Temporarily disable automatic memory writes without uninstalling the plugin:

```bash
OPENCLAW_RECALL_AUTO_WRITE=false
```

## Hook behavior

### `before_prompt_build`

- load session state
- retrieve boot memory and relevant memory
- compress older history
- assemble injected prompt layers

### `after_tool_call`

- compact tool output
- store summary plus raw payload reference

### `tool_result_persist`

- replace large tool payloads with compacted text in the persisted path

### `agent_end`

- store transcript turns
- extract and write new memories
- update session state
- record turn profile

## Enable, disable, uninstall

```bash
openclaw plugins enable openclaw-recall
openclaw plugins disable openclaw-recall
openclaw plugins uninstall openclaw-recall
```

## Inspect route

Default path:

```text
/plugins/openclaw-recall
```

Endpoints:

- `/dashboard`
- `/status`
- `/memories`
- `/memories/:id`
- `/profiles`
- `/profiles/:runId`
- `/sessions`
- `/sessions/:sessionId`

## Compatibility and limits

- The supported operator surface is the standalone `openclaw-recall` binary. OpenClaw plugin metadata can advertise plugin commands, but current OpenClaw command parsing does not reliably expose the plugin's command tree as `openclaw <subcommand>`.
- Embeddings default to local hashed vectors to avoid forcing external dependencies. OpenAI-compatible embeddings are optional.
- Prompt token accounting can be `exact` when the provider emits usage metadata. Compression savings and tool compaction savings remain `estimated`.
- Some OpenClaw install/info flows may emit a `plugins.allow is empty` warning before config is fully written. This is runtime noise, not a plugin failure.

See [COMPATIBILITY.md](./COMPATIBILITY.md) for the full verified matrix.
