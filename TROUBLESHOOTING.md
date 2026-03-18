# Troubleshooting

Common issues, known limitations, and how to fix them.

---

## Known Limitations

These are known release limitations in `1.3.2`, not blockers for normal use.

- Compression and tool-token savings are partly estimated
- Provider smoke coverage is strongest on the OpenAI Responses path
- `openclaw <subcommand>` CLI exposure is upstream-limited; use `openclaw-recall` directly
- OpenClaw may emit `plugins.allow is empty` warning noise in some install flows — safe to ignore
- Memory conflict resolution is rule-based (stable preference supersession is supported, but complex conflicts are not yet resolved semantically)
- `reconnect` mode uses the built-in `recall-http` backend; generic external remote backends are not release-verified

---

## Diagnostics

Always start with:

```bash
openclaw-recall doctor
openclaw-recall status
```

`doctor` checks the plugin health end-to-end. `status` reports memory hygiene state, last prune/reindex/compact timestamps, and recent import stats.

---

## Memory Issues

### Preferences not being recalled across sessions

1. Check memory was written: `openclaw-recall memory list`
2. Check what would be retrieved: `openclaw-recall memory explain "<your query>"`
3. Look for noisy rows suppressing valid memory: `openclaw-recall status` → check `noisyActiveMemoryCount`
4. If noisy count is high: `openclaw-recall memory prune-noise --dry-run` then `openclaw-recall memory prune-noise`

### Old stale rows polluting recall

```bash
openclaw-recall memory prune-noise --dry-run   # preview
openclaw-recall memory prune-noise             # execute
openclaw-recall memory reindex
openclaw-recall memory compact
```

### Memory not surviving after import

Long-form import in `1.3.2` chunks oversized segments. If signal is still lost:
1. `openclaw-recall import status` — check `rejectedNoise` and `uncertainCandidates` counts
2. Try re-importing with smaller source files

---

## Install Issues

### `plugins.allow is empty` warning

Known noise from OpenClaw's plugin CLI in some install and info flows. Does not affect functionality.

### Plugin not recognized after install

```bash
openclaw plugins info openclaw-recall
openclaw-recall config validate
openclaw-recall doctor
```

If `config validate` fails, re-run:
```bash
openclaw-recall config init --mode local --write-openclaw
```

---

## Inspect

For deeper debugging, use the inspect routes inside OpenClaw:

```
/plugins/openclaw-recall/dashboard
/plugins/openclaw-recall/status
/plugins/openclaw-recall/memories
/plugins/openclaw-recall/sessions/:sessionId
```

Or via CLI:
```bash
openclaw-recall memory inspect <id>
openclaw-recall memory explain "<query>"
openclaw-recall session inspect <sessionId>
openclaw-recall profile inspect <runId>
```
