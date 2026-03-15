# Quickstart

Install OpenClaw Recall, prove the hooks are active, and verify memory, recall, compression, and profile output with the fewest moving parts.

## Prerequisites

- Node.js 24+
- OpenClaw installed and working
- shell access on the machine that runs OpenClaw

## Fast path from npm

```bash
npm install openclaw-recall
openclaw plugins install --link ./node_modules/openclaw-recall
openclaw plugins info openclaw-recall
openclaw-recall doctor
openclaw-recall status
```

## Fast path from source

```bash
git clone https://github.com/Felix201209/openclaw-recall.git
cd openclaw-recall
npm install
npm run build
openclaw plugins install --link .
openclaw plugins info openclaw-recall
openclaw-recall doctor
openclaw-recall status
```

## Optional starter config

```bash
openclaw-recall config init
openclaw-recall config init --write-openclaw
openclaw-recall config validate
```

## Common environment overrides

Start from [`.env.example`](./.env.example).

```bash
OPENCLAW_RECALL_EMBEDDING_PROVIDER=local
OPENCLAW_RECALL_CONTEXT_BUDGET=2400
OPENCLAW_RECALL_RECENT_TURNS=6
OPENCLAW_RECALL_HTTP_PATH=/plugins/openclaw-recall
```

## First proof run

```bash
npm run demo
```

That demonstrates:

- automatic memory write
- cross-session recall
- tool compaction
- profile recording

## Full smoke path

```bash
npm run smoke
```

## Release-grade validation path

```bash
npm run verify
```

That additionally checks:

- tarball contents
- install from generated tarball
- OpenClaw plugin load from installed package path
- installed CLI execution for doctor/status/session inspect

## What success looks like

- `openclaw plugins info openclaw-recall` shows `Status: loaded`
- `openclaw-recall doctor` has no `fail` checks
- `openclaw-recall status` shows non-zero `memoryCount` and `profileCount` after a demo run
- `openclaw-recall profile list --json` shows `promptTokensSource: "exact"` on provider paths that return usage
