# Examples

## Minimal memory demo

User message:

```text
以后默认叫我 Felix，用中文回答，并且尽量简洁。
```

Expected result:

- OpenClaw Recall writes `preference` memory rows
- later sessions no longer need the full original transcript to recover the preference

## Cross-session recall demo

Start a new session and ask:

```text
你记得我的偏好吗？
```

Expected result:

- relevant memories are retrieved before prompt build
- the assistant recalls `Felix`, `中文`, and `简洁`
- profile output shows retrieval evidence

Example output from the repository demo:

```text
我记得：• [preference] User prefers to be addressed as Felix，用中文回答，并且尽量简洁。. (score=18.34; importance=9.2; why=high-value memory type, high confidence for "你记得我的偏好吗？".)
```

## Tool compaction demo

User message:

```text
read "README.md"
```

Expected result:

- raw tool payload is compacted
- `savedTokens` becomes non-zero
- `toolTokensSavedSource` remains `estimated`, not fake-exact

## Inspect what happened

```bash
openclaw-recall memory list
openclaw-recall memory explain "你记得我的偏好吗？"
openclaw-recall profile list
openclaw-recall session inspect plugin-smoke-3
```

Success indicators:

- `memory list` contains preference rows mentioning Felix, Chinese, or concise replies
- `memory explain` gives ranked retrieval reasons
- `profile list --json` shows at least one run with `promptTokensSource: "exact"`
- `session inspect` shows tool results with `savedTokens > 0`

## Sample status output

```json
{
  "enabled": true,
  "memoryCount": 3,
  "profileCount": 3,
  "sessionCount": 3,
  "recentRetrievalCount": 3,
  "recentCompressionSavings": 207,
  "recentMemoryWrites": 0,
  "latestProfile": {
    "promptTokensSource": "exact",
    "compressionSavingsSource": "estimated"
  }
}
```
