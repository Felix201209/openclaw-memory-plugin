# Release Notes

## OpenClaw Recall v1.1.0

`1.1.0` is the first release that makes OpenClaw Recall a full persistent-memory infrastructure plugin instead of only a local memory enhancement layer. It adds a real reconnectable backend path, hybrid retrieval, shared scopes, smarter import/export/recovery, lifecycle-aware hygiene, and stronger operator visibility while keeping the plugin boundary focused on OpenClaw memory.

### Highlights

- built-in `recall-http` backend support for remote persistent memory spaces
- reconnectable memory spaces across machines and clean installs
- formal `keyword` / `embedding` / `hybrid` retrieval modes with explainable contribution reporting
- scope-aware memory behavior across `private`, `workspace`, `shared`, and `session`
- smarter import/export/recovery flows with scope preservation and duplicate merge/supersede reporting
- lifecycle-aware hygiene for stale semantic, superseded, expired, and retrieval-ineligible records
- stronger operator surfaces for `doctor`, `status`, `memory inspect`, `memory explain`, `profile inspect`, and `session inspect`

### User-visible benefits

- persistent memory can survive resets, reinstalls, clean installs, and machine switches through reconnectable memory spaces
- restored installs surface remembered project context or stable preferences in normal answers, not only in inspect/debug output
- hybrid retrieval keeps prompts leaner while still falling back safely when embeddings are unavailable
- scope-aware behavior makes cross-agent shared recall possible without accidentally leaking private memory
- lifecycle-aware hygiene keeps stale or superseded memory inspectable without letting it pollute normal retrieval
- operator debugging is stronger and more honest about exact versus estimated metrics

### Install

```bash
npm install @felixypz/openclaw-recall
openclaw plugins install --link ./node_modules/@felixypz/openclaw-recall
openclaw plugins info openclaw-recall
openclaw-recall doctor
openclaw-recall status
```

### Compatibility

- verified OpenClaw target: `>=2026.3.13`
- verified Node versions: `24.10.0`, `24.12.0`
- strongest validated provider/runtime path: `openai-responses`
- verified backends: `local` and built-in `recall-http`
- verified install paths: source install, installed-package link, generated tarball, clean consumer remote roundtrip

### Known limitations

- `compressionSavings` and `toolTokensSaved` remain partly `estimated`
- OpenClaw plugin CLI exposure through `openclaw <subcommand>` is still upstream-limited; use `openclaw-recall`
- OpenAI-compatible embeddings are supported but not covered by the strongest release-confidence path
- some OpenClaw install/info flows may emit `plugins.allow is empty` warning noise
- memory conflict resolution remains rule-based
