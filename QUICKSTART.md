# Quickstart

Get from install to first successful recall in under 10 minutes.

---

## Install

### From npm

```bash
npm install @felixypz/openclaw-recall
openclaw plugins install --link ./node_modules/@felixypz/openclaw-recall
openclaw-recall config init --mode local --write-openclaw
openclaw plugins info openclaw-recall
openclaw-recall config validate
openclaw-recall doctor
openclaw-recall status
```

### From source

```bash
git clone https://github.com/Felix201209/openclaw-recall.git
cd openclaw-recall
npm install && npm run build
openclaw plugins install --link .
openclaw-recall config init --mode local --write-openclaw
openclaw plugins info openclaw-recall
openclaw-recall config validate
openclaw-recall doctor
openclaw-recall status
```

---

## Identity Modes

| Mode | When to use |
|---|---|
| `local` | Machine-local durable memory only |
| `reconnect` | Reconnect the same memory space across machines or a fresh OpenClaw home |

```bash
# Local
openclaw-recall config init --mode local

# Reconnect
openclaw-recall config init --mode reconnect --identity-key recall_xxx --memory-space space_xxx

openclaw-recall config validate
```

> **Security:** Identity keys are secrets. Store them in a password manager.

---

## Recommended First-Use Workflow

1. Install the plugin
2. Initialize config (`local` or `reconnect`)
3. `openclaw-recall import dry-run`
4. `openclaw-recall import run`
5. Verify with `doctor` · `status` · `memory explain` · `profile inspect`

If you already have transcripts or memory files, importing them is the fastest proof path.

Import behavior in `1.3.2`:
- Duplicate rows are merged or superseded instead of duplicated
- `rejectedNoise`, `rejectedSensitive`, and `uncertainCandidates` tracked separately
- Generic imports no longer silently promote semantic memory into `shared`
- Exported plugin artifacts preserve their stored scope metadata

---

## 5-Minute Value Check

**1. Write a preference**
```
Remember that I like you to call me Felix.
```

**2. Verify recall in a new session**
```
Did you remember my preferences?
```

**3. Trigger a tool payload**
```
read "README.md"
```

**4. Inspect results**
```bash
openclaw-recall memory list
openclaw-recall memory explain "Did you remember my preferences?"
openclaw-recall profile list
openclaw-recall session inspect <sessionId>
```

**Success looks like:**
- Memory rows mentioning `Felix`, `English`, or `Concise`
- Recall works without replaying the earlier transcript
- Tool results show `savedTokens > 0`
- Profile rows show compression evidence

See [EXAMPLES.md](EXAMPLES.md) for a full copyable walkthrough.
