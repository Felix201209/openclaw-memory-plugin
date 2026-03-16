import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, readJsonFile, writeJsonFile } from "../shared/fileStore.js";
import type { ExportReport } from "../types/domain.js";
import type { PluginContainer } from "../plugin/runtime-state.js";
import type { ResolvedPluginConfig } from "../config/schema.js";
import { resolvePluginPaths } from "../storage/paths.js";

export class ExportService {
  private readonly paths = resolvePluginPaths();

  constructor(
    private readonly container: PluginContainer,
    private readonly config: ResolvedPluginConfig,
  ) {}

  async exportMemory(format: "json" | "jsonl" = this.config.exports.defaultFormat): Promise<ExportReport> {
    const records = await this.container.memoryStore.listActive();
    return await this.writeExport("memory", records, format, undefined, summarizeScopes(records));
  }

  async exportProfile(format: "json" | "jsonl" = this.config.exports.defaultFormat): Promise<ExportReport> {
    const records = await this.container.profileStore.list(500);
    return await this.writeExport("profile", records, format);
  }

  async exportSession(sessionId?: string, format: "json" | "jsonl" = this.config.exports.defaultFormat): Promise<ExportReport> {
    const records = sessionId
      ? [await this.container.eventStore.getSessionSummary(sessionId), ...(await this.container.eventStore.listTurns(sessionId))]
      : await this.container.eventStore.listSessions(200);
    return await this.writeExport("session", records.filter(Boolean), format, sessionId);
  }

  async latest(): Promise<ExportReport | null> {
    return await readJsonFile<ExportReport | null>(this.paths.latestExportPath, null);
  }

  private async writeExport(
    kind: ExportReport["kind"],
    records: unknown[],
    format: "json" | "jsonl",
    sessionId?: string,
    scopeCounts?: ExportReport["scopeCounts"],
  ): Promise<ExportReport> {
    const exportId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const exportRoot = path.resolve(this.paths.pluginRoot, this.config.exports.directory);
    await ensureDir(exportRoot);
    const outputPath = path.join(
      exportRoot,
      `${kind}${sessionId ? `-${sessionId}` : ""}-${createdAt.replace(/[:.]/g, "-")}.${format}`,
    );

    if (format === "jsonl") {
      await fs.writeFile(outputPath, records.map((record) => JSON.stringify(record)).join("\n"));
    } else {
      await writeJsonFile(outputPath, records);
    }

    const report: ExportReport = {
      exportId,
      kind,
      format,
      createdAt,
      outputPath,
      itemCount: records.length,
      sessionId,
      scopeCounts,
    };
    await writeJsonFile(this.paths.latestExportPath, report);
    return report;
  }
}

function summarizeScopes(records: Array<{ scope?: string }>): ExportReport["scopeCounts"] {
  return records.reduce<NonNullable<ExportReport["scopeCounts"]>>((summary, record) => {
    const scope = record.scope;
    if (scope === "private" || scope === "workspace" || scope === "shared" || scope === "agent_local") {
      summary[scope] = (summary[scope] ?? 0) + 1;
    }
    return summary;
  }, {});
}
