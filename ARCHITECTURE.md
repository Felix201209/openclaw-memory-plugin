# Architecture

## Goal

Attach a memory, compression, and profiling enhancement layer to OpenClaw without replacing OpenClaw's main product shell.

## Hook points

The plugin currently attaches to these OpenClaw lifecycle hooks:

- `before_prompt_build`
- `llm_input`
- `llm_output`
- `after_tool_call`
- `tool_result_persist`
- `before_compaction`
- `after_compaction`
- `agent_end`
- `before_reset`

Implementation entry:

- [`src/plugin/index.ts`](./src/plugin/index.ts)
- [`src/plugin/hooks.ts`](./src/plugin/hooks.ts)

## Memory pipeline

```text
run starts
-> retrieve boot memory + query-aware memory
-> inject memory into prompt build
-> agent completes
-> extract memory candidates from user turn + assistant turn
-> classify into preference / semantic / session_state / episodic
-> importance thresholding
-> dedupe / merge / supersede
-> write memories and session state
```

Core modules:

- [`src/memory/MemoryExtractor.ts`](./src/memory/MemoryExtractor.ts)
- [`src/memory/MemoryStore.ts`](./src/memory/MemoryStore.ts)
- [`src/memory/MemoryRetriever.ts`](./src/memory/MemoryRetriever.ts)
- [`src/memory/MemoryRanker.ts`](./src/memory/MemoryRanker.ts)
- [`src/memory/SessionStateStore.ts`](./src/memory/SessionStateStore.ts)

### Default memory rules

- preferences and stable facts receive long TTL and low decay
- episodic memory receives short TTL and fast decay
- session-state records current task, constraints, decisions, and open questions
- conflicting memories in the same `memoryGroup` are versioned and can supersede older rows

## Compression pipeline

```text
before_prompt_build
-> load session state
-> retrieve relevant memory
-> compact recent tool output
-> compress older history
-> assemble layered prompt
-> enforce context budget
```

Core modules:

- [`src/compression/ContextCompressor.ts`](./src/compression/ContextCompressor.ts)
- [`src/compression/PromptBuilder.ts`](./src/compression/PromptBuilder.ts)
- [`src/compression/BudgetManager.ts`](./src/compression/BudgetManager.ts)
- [`src/compression/ToolOutputCompactor.ts`](./src/compression/ToolOutputCompactor.ts)
- [`src/compression/ToolOutputStore.ts`](./src/compression/ToolOutputStore.ts)

Prompt layer order is fixed:

1. `SYSTEM`
2. `TASK STATE`
3. `RELEVANT MEMORY`
4. `COMPRESSED TOOL OUTPUT`
5. `OLDER HISTORY SUMMARY`
6. `RECENT TURNS`
7. `CURRENT USER MESSAGE`

## Profiling pipeline

Each completed run records:

- prompt size
- prompt budget
- memory injected
- memory candidates and writes
- tool tokens and tool savings
- compression savings
- retrieval count
- prompt layer details
- recalled memory reasons
- compaction events

Core modules:

- [`src/profiling/TurnProfileStore.ts`](./src/profiling/TurnProfileStore.ts)
- [`src/profiling/EventStore.ts`](./src/profiling/EventStore.ts)

## Storage model

SQLite tables:

- `turns`
- `memories`
- `session_state`
- `session_metadata`
- `session_runtime`
- `tool_outputs`
- `turn_profiles`

Storage bootstrap:

- [`src/storage/PluginDatabase.ts`](./src/storage/PluginDatabase.ts)

## Inspect surface

The plugin registers an authenticated HTTP route inside OpenClaw:

- dashboard HTML
- status JSON
- memory list/detail/explain
- profile list/detail
- session list

Implementation:

- [`src/inspect/http.ts`](./src/inspect/http.ts)
- [`src/inspect/dashboard.ts`](./src/inspect/dashboard.ts)

## Operator CLI

The plugin ships a standalone operator CLI, not a replacement for `openclaw`:

- `doctor`
- `status`
- `memory *`
- `profile *`
- `config show`

Implementation:

- [`src/cli/index.ts`](./src/cli/index.ts)

## Non-goals

- Replacing OpenClaw's full CLI/TUI/Web UI
- Shipping a parallel runtime or gateway
- Forking OpenClaw's provider stack
