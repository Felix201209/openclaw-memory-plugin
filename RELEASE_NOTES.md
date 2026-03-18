# Release Notes

## OpenClaw Recall v1.3.2

`1.3.2` focuses on hardening the `1.3.x` line rather than changing the product shape. The main themes are consistent memory identity, more predictable retrieval under failure, better multilingual preference handling, and a much more usable inspect surface.

### Highlights

- memory fingerprints and embedding text are now generated from shared helpers so local storage, recall-http, extraction, and hygiene flows stay aligned
- retrieval now logs the original embedding failure reason before falling back to keyword mode and avoids ranking an oversized keyword candidate set
- question-form preference requests still become durable preferences, but no longer also create duplicate open-question session state
- CJK tokenization keeps searchable multi-character tokens while dropping single-character overmatching noise
- the inspect dashboard is now a filterable notes explorer with visibility into active, inactive, and superseded memories
- test helpers now resolve `tsx.cmd` on Windows so the CLI test path is more portable

### User-visible benefits

- preference edits and merges are less likely to drift because identity rules are consistent everywhere
- fallback retrieval is easier to debug when embedding calls fail at runtime
- Chinese and other CJK preference prompts are more likely to match usefully without flooding retrieval with low-signal hits
- inspect routes are practical for day-to-day debugging instead of only being a raw operator surface

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

### Known limitations

- `compressionSavings` and `toolTokensSaved` remain partly `estimated`
- OpenClaw plugin CLI exposure through `openclaw <subcommand>` is still upstream-limited; use `openclaw-recall`
- OpenAI-compatible embeddings are supported but not covered by the strongest release-confidence path
- some OpenClaw install/info flows may emit `plugins.allow is empty` warning noise
- memory conflict resolution remains rule-based

## OpenClaw Recall v1.3.0

`1.3.0` was a real minor release because it materially improved Recall's hybrid retrieval composition and long-form import quality while keeping the project memory-first. The focus remained practical: better mixed recall, denser `RELEVANT MEMORY`, better preservation of useful imported project signal, and stronger token efficiency without weakening hygiene or output safety.

### Highlights

- RRF-style fusion now strengthens hybrid retrieval so preference, project, and task memories survive together more often
- candidate-pool expansion, MMR-style diversification, and relation-aware stitching continue to reduce duplicate-heavy recall
- `RELEVANT MEMORY` is less duplicate-heavy and more efficient per token
- tool-output compaction still preserves useful structure, including commands, code blocks, wrapper-unwrapped text, and error-rich output
- long-form import now chunks oversized source rows so more project signal survives later recall while noise and sensitive rows remain rejected
- new v1.3 benchmark coverage proves retrieval fusion, import chunking, compaction, and operator behavior more directly

### User-visible benefits

- recall now does a better job of mixing “who the user is”, “what the project is”, and “what the current task is”
- restored/imported project context is less likely to collapse into a single coarse row
- prompts waste less space on duplicate preference summaries
- tool-output compaction keeps more high-value structure per token
- imports are more likely to produce useful later recall instead of just adding rows
- operator surfaces remain honest and inspectable while the memory system gets more selective

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
