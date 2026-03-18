# OpenClaw Integration

How OpenClaw Recall integrates with OpenClaw, and how identity and configuration are managed.

---

## Identity Modes

OpenClaw Recall supports two persistent identity paths:

- `local` — durable memory stays on the current OpenClaw home
- `reconnect` — the same identity key or memory space ID reconnects the same logical memory space across machines

Use `local` for machine-local durable memory only.
Use `reconnect` when you already have an identity key or memory space ID and want to reconnect on another machine or a fresh OpenClaw home.

```bash
openclaw-recall config init --mode local
openclaw-recall config init --mode reconnect --identity-key recall_xxx --memory-space space_xxx
openclaw-recall config validate
```

> **Security:** Identity keys are secrets. Store them in a password manager or another secure secret store.

---

## Identity Environment Variables

```
OPENCLAW_RECALL_IDENTITY_MODE
OPENCLAW_RECALL_IDENTITY_KEY
OPENCLAW_RECALL_MEMORY_SPACE_ID
OPENCLAW_RECALL_IDENTITY_API_KEY
OPENCLAW_RECALL_IDENTITY_ENDPOINT
OPENCLAW_RECALL_EXPORT_DIRECTORY
```

---

## Plugin Registration

After install, verify the plugin is registered correctly:

```bash
openclaw plugins info openclaw-recall
openclaw-recall config validate
openclaw-recall doctor
```

OpenClaw may emit a `plugins.allow is empty` warning in some install or info flows — this is known noise and does not affect functionality.

---

## Reconnect and Cloud Continuity

`reconnect` mode uses the built-in `recall-http` backend. Generic external remote backends are not release-verified in `1.3.2`.

For cross-machine continuity:
1. Export your identity key from the original machine
2. Store it securely
3. On the new machine: `openclaw-recall config init --mode reconnect --identity-key <key> --memory-space <id>`

---

## Inspect Routes

OpenClaw Recall exposes an inspection surface inside OpenClaw:

```
/plugins/openclaw-recall/dashboard
/plugins/openclaw-recall/status
/plugins/openclaw-recall/memories
/plugins/openclaw-recall/profiles
/plugins/openclaw-recall/sessions
/plugins/openclaw-recall/sessions/:sessionId
```

This is a plugin inspection surface, not a replacement UI.
