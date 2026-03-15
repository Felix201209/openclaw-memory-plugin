# OpenClaw Recall

Persistent memory, context compression, and profile visibility for OpenClaw.

OpenClaw Recall is an enhancement plugin for OpenClaw. It adds automatic memory write, cross-session recall, prompt compression, tool output compaction, and inspectable profile data without replacing OpenClaw's runtime or product shell.

## Why OpenClaw users install it

OpenClaw Recall targets four recurring problems:

- stable user preferences get forgotten between sessions
- long histories waste prompt budget
- large tool payloads get replayed back into the model
- prompt construction stays opaque when something goes wrong

After installing it, you get:

- automatic memory write for `preference`, `semantic`, `episodic`, and `session_state`
- query-aware retrieval before prompt build
- layered context compression with budget enforcement
- tool output compaction with saved-token reporting
- operator visibility through `doctor`, `status`, `memory explain`, `profile inspect`, and inspect routes

## 3-minute install

```bash
npm install openclaw-recall
openclaw plugins install --link ./node_modules/openclaw-recall
openclaw plugins info openclaw-recall
openclaw-recall doctor
openclaw-recall status
```

If you are working from source instead:

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

## 5-minute value check

1. Tell OpenClaw: `以后默认叫我 Felix，用中文回答，并且尽量简洁。`
2. Start a new session and ask: `你记得我的偏好吗？`
3. Trigger a tool payload: `read "README.md"`
4. Inspect the results:

```bash
openclaw-recall memory list
openclaw-recall memory explain "你记得我的偏好吗？"
openclaw-recall profile list
openclaw-recall session inspect <sessionId>
```

Success looks like:

- memory rows mentioning `Felix`, `中文`, or `简洁`
- recall working without replaying the earlier transcript
- tool results with `savedTokens > 0`
- profile rows showing prompt/token source quality and compression evidence

See [EXAMPLES.md](./EXAMPLES.md) for a copyable walkthrough.

## Operator CLI

```bash
openclaw-recall doctor
openclaw-recall status
openclaw-recall config show
openclaw-recall config validate
openclaw-recall config init
openclaw-recall memory list
openclaw-recall memory inspect <id>
openclaw-recall memory search "<query>"
openclaw-recall memory explain "<query>"
openclaw-recall profile list
openclaw-recall profile inspect <runId>
openclaw-recall session list
openclaw-recall session inspect <sessionId>
```

## Inspect routes

OpenClaw Recall exposes a small inspect surface inside OpenClaw:

- `/plugins/openclaw-recall/dashboard`
- `/plugins/openclaw-recall/status`
- `/plugins/openclaw-recall/memories`
- `/plugins/openclaw-recall/profiles`
- `/plugins/openclaw-recall/sessions`
- `/plugins/openclaw-recall/sessions/:sessionId`

This is a plugin inspection surface, not a replacement UI.

## Defaults and configuration

The default strategy is meant to work without a long tuning session:

- local hashed embeddings by default
- longer TTL for `preference`, shorter TTL for `episodic`
- automatic memory writes enabled by default
- context budget defaults to `2400`
- recent-turn window defaults to `6`
- history summary starts once the turn count crosses its threshold
- detailed profiles enabled by default

Configuration precedence:

1. `OPENCLAW_RECALL_*` environment variables
2. `plugins.entries.openclaw-recall.config`
3. built-in defaults

Legacy `OPENCLAW_MEMORY_PLUGIN_*` variables are still accepted as compatibility aliases during the rename transition.

## Compatibility

Verified for `1.0.0`:

- Node.js `24.10.0` and `24.12.0`
- OpenClaw `2026.3.13`
- OpenAI Responses runtime path for exact prompt-token accounting
- source-link install and tarball install flows

Full matrix: [COMPATIBILITY.md](./COMPATIBILITY.md)

## Metric accuracy

OpenClaw Recall does not pretend every number is exact:

- `promptTokensSource=exact` when provider usage metadata is available
- `promptTokensSource=estimated` when it is not
- `compressionSavingsSource=estimated` and `toolTokensSavedSource=estimated` when savings come from heuristic comparisons

## Known limitations

- compression savings and tool-token savings are still partly estimated
- provider smoke coverage is strongest on the OpenAI Responses path
- OpenClaw plugin CLI exposure through `openclaw <subcommand>` is still upstream-limited; use `openclaw-recall`
- OpenClaw may emit `plugins.allow is empty` warning noise in some install/info flows
- memory conflict resolution is still rule-based

These are known release limitations, not blockers for normal use.

## Verification and packaging

```bash
npm run check
npm run build
npm run test:unit
npm run test:integration
npm run test:install
npm run smoke
npm run verify
npm run release:build
```

## Docs

- [QUICKSTART.md](./QUICKSTART.md)
- [OPENCLAW-INTEGRATION.md](./OPENCLAW-INTEGRATION.md)
- [COMPATIBILITY.md](./COMPATIBILITY.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [OPERATIONS.md](./OPERATIONS.md)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [EXAMPLES.md](./EXAMPLES.md)
- [RELEASE_NOTES.md](./RELEASE_NOTES.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [NOTICE](./NOTICE)
- [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)
