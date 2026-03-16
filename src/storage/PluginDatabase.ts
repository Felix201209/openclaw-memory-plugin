import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export class PluginDatabase {
  readonly connection: DatabaseSync;

  constructor(private readonly filePath: string) {
    const alreadyExists = fs.existsSync(filePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.connection = new DatabaseSync(filePath);
    this.connection.exec("PRAGMA busy_timeout = 5000;");
    this.connection.exec("PRAGMA foreign_keys = ON;");
    if (!alreadyExists) {
      this.enableWalMode();
    } else {
      try {
        this.enableWalMode();
      } catch (error) {
        if (!isBusyError(error)) {
          throw error;
        }
      }
    }
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS turns (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        metadata_json TEXT
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        topics_json TEXT NOT NULL,
        entity_keys_json TEXT NOT NULL,
        salience REAL NOT NULL,
        fingerprint TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        last_accessed_at INTEGER,
        ttl_days INTEGER,
        decay_rate REAL NOT NULL,
        meta_json TEXT,
        source_session_id TEXT NOT NULL,
        source_turn_ids_json TEXT NOT NULL,
        embedding_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_state (
        session_id TEXT PRIMARY KEY,
        current_task TEXT,
        constraints_json TEXT NOT NULL,
        decisions_json TEXT NOT NULL,
        open_questions_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_metadata (
        session_id TEXT PRIMARY KEY,
        title TEXT,
        archived_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_runtime (
        session_id TEXT PRIMARY KEY,
        last_run_id TEXT,
        last_user_prompt TEXT,
        last_profile_json TEXT,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_outputs (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        run_id TEXT,
        tool_name TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        compacted TEXT NOT NULL,
        raw_json TEXT NOT NULL,
        estimated_tokens INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS turn_profiles (
        run_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        prompt_tokens INTEGER NOT NULL,
        prompt_tokens_source TEXT NOT NULL DEFAULT 'estimated',
        prompt_budget INTEGER NOT NULL,
        memory_injected INTEGER NOT NULL,
        memory_candidates INTEGER NOT NULL,
        memory_written INTEGER NOT NULL,
        tool_tokens INTEGER NOT NULL,
        tool_tokens_source TEXT NOT NULL DEFAULT 'estimated',
        tool_tokens_saved INTEGER NOT NULL,
        tool_tokens_saved_source TEXT NOT NULL DEFAULT 'estimated',
        history_summary_tokens INTEGER NOT NULL,
        history_summary_tokens_source TEXT NOT NULL DEFAULT 'estimated',
        compression_savings INTEGER NOT NULL,
        compression_savings_source TEXT NOT NULL DEFAULT 'estimated',
        retrieval_count INTEGER NOT NULL,
        retrieval_mode TEXT NOT NULL DEFAULT 'keyword',
        keyword_contribution REAL NOT NULL DEFAULT 0,
        semantic_contribution REAL NOT NULL DEFAULT 0,
        details_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_turns_session_created ON turns(session_id, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_session_metadata_archived ON session_metadata(archived_at);
      CREATE INDEX IF NOT EXISTS idx_memories_fingerprint ON memories(fingerprint);
      CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(source_session_id);
      CREATE INDEX IF NOT EXISTS idx_tool_outputs_session ON tool_outputs(session_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tool_outputs_fingerprint ON tool_outputs(session_id, fingerprint);
      CREATE INDEX IF NOT EXISTS idx_turn_profiles_session ON turn_profiles(session_id, created_at DESC);
    `);
    this.ensureColumn("memories", "meta_json", "TEXT");
    this.ensureColumn("turn_profiles", "prompt_tokens_source", "TEXT NOT NULL DEFAULT 'estimated'");
    this.ensureColumn("turn_profiles", "tool_tokens_source", "TEXT NOT NULL DEFAULT 'estimated'");
    this.ensureColumn("turn_profiles", "tool_tokens_saved_source", "TEXT NOT NULL DEFAULT 'estimated'");
    this.ensureColumn(
      "turn_profiles",
      "history_summary_tokens_source",
      "TEXT NOT NULL DEFAULT 'estimated'",
    );
    this.ensureColumn(
      "turn_profiles",
      "compression_savings_source",
      "TEXT NOT NULL DEFAULT 'estimated'",
    );
    this.ensureColumn("turn_profiles", "retrieval_mode", "TEXT NOT NULL DEFAULT 'keyword'");
    this.ensureColumn("turn_profiles", "keyword_contribution", "REAL NOT NULL DEFAULT 0");
    this.ensureColumn("turn_profiles", "semantic_contribution", "REAL NOT NULL DEFAULT 0");
  }

  get path(): string {
    return this.filePath;
  }

  private enableWalMode(): void {
    this.connection.exec("PRAGMA journal_mode = WAL;");
  }

  private ensureColumn(tableName: string, columnName: string, definition: string): void {
    const rows = this.connection
      .prepare(`PRAGMA table_info(${tableName})`)
      .all() as Array<{ name?: string }>;
    if (rows.some((row) => row.name === columnName)) {
      return;
    }
    this.connection.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

function isBusyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /database is locked|SQLITE_BUSY/i.test(message);
}
