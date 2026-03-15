# Troubleshooting

## `Plugin not found: openclaw-recall`

Cause:

- plugin not installed into the active OpenClaw profile/home
- you are querying a different `OPENCLAW_HOME`

Check:

```bash
openclaw config file
openclaw plugins list
openclaw plugins info openclaw-recall
```

Fix:

```bash
openclaw plugins install --link /path/to/openclaw-recall
```

If you are testing a release tarball instead of a source checkout:

```bash
npm install ./openclaw-recall-<version>.tgz
openclaw plugins install --link ./node_modules/openclaw-recall
```

## `doctor` says no recent hook activity

Cause:

- plugin is installed but no agent run has completed yet
- plugin entry is disabled

Check:

```bash
openclaw-recall status
openclaw-recall config show
```

Fix:

- run a short conversation through OpenClaw
- verify `plugins.entries.openclaw-recall.enabled` is not `false`

## No memories are being written

Likely causes:

- `OPENCLAW_RECALL_AUTO_WRITE=false`
- messages are not passing the write threshold
- you only ran recall questions, not stable preference/fact turns

Check:

```bash
openclaw-recall memory list
openclaw-recall profile list
```

Try a clearer seed turn:

```text
以后默认叫我 Felix，用中文回答，并且尽量简洁。
```

If you intentionally disabled auto-write, re-enable it:

```bash
unset OPENCLAW_RECALL_AUTO_WRITE
```

## OpenAI-compatible embeddings selected but no key found

Fix one of:

- switch back to `OPENCLAW_RECALL_EMBEDDING_PROVIDER=local`
- or provide `OPENCLAW_RECALL_EMBEDDING_API_KEY`

## Why do some savings fields still say `estimated`?

Cause:

- prompt token counts can be exact when provider usage is returned
- savings values still come from heuristic before/after comparisons

This is expected in 1.0.0.

## SQLite appears locked

The plugin uses `busy_timeout` and WAL when available, so brief contention should clear automatically. If you see repeated failures:

- stop overlapping test processes
- rerun the command
- if needed, restart the long-running process holding the DB

## Inspect route not available

Check:

```bash
openclaw-recall config show
```

Confirm `inspect.httpPath` starts with `/plugins/` and that OpenClaw loaded the plugin.

## `doctor` warns about env/config precedence

Cause:

- one or more `OPENCLAW_RECALL_*` variables override `openclaw.json`

Fix:

- remove the temporary env override
- or keep it intentionally and document it in your deployment config

Use:

```bash
openclaw-recall config show
```

to confirm the resolved precedence chain.

## I want to reset plugin state

Delete:

```text
$OPENCLAW_HOME/.openclaw/plugins/openclaw-recall/
```

This only clears plugin-managed memory, profile, and tool state.
