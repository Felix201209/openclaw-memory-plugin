# Compatibility

## Release target

This matrix applies to `1.0.0`.

## Verified versions

### OpenClaw

- verified: `2026.3.13`
- compatibility target: `>=2026.3.13`

### Node.js

- verified: `24.10.0` and `24.12.0`
- declared engine: `>=24.0.0`

## Verified provider/runtime paths

### Fully smoke-tested

- `openai-responses`
  - prompt token usage can be `exact` when OpenClaw or the provider returns usage metadata
  - verified in embedded integration, source install, and tarball install flows

### Supported but not fully smoke-tested in 1.0.0

- OpenAI-compatible embeddings via `embedding.provider=openai`
  - configuration is supported
  - automated smoke currently covers local hashed embeddings by default instead

### Not yet 1.0.0-verified

- non-OpenAI runtime provider paths
  - no claim of full smoke coverage in 1.0.0

## Verified install paths

- source checkout + `openclaw plugins install --link .`
- installed package + `openclaw plugins install --link ./node_modules/openclaw-recall`
- generated tarball install into a fresh consumer directory
- standalone CLI execution from `dist/`
- standalone CLI execution from installed package bin

## Known unstable or limited areas

- `compressionSavings` and `toolTokensSaved` are still `estimated`
  - workaround: treat savings as directional, not exact
- provider smoke coverage is uneven
  - workaround: prefer the verified OpenAI Responses path for first deployment
- plugin CLI exposure through `openclaw <subcommand>` is not reliable upstream
  - workaround: use the standalone `openclaw-recall` binary
- OpenClaw may emit `plugins.allow is empty` warning noise in some install/info flows
  - workaround: set explicit `plugins.allow` in OpenClaw config
- memory conflict resolution is still rule-based
  - workaround: inspect memory rows with `memory explain` and `memory inspect` when tuning behavior

## Evidence used for 1.0.0

- `npm run build`
- `npm run test:unit`
- `npm run test:integration`
- `npm run smoke`
- `npm run verify`
- `npm publish --dry-run`
