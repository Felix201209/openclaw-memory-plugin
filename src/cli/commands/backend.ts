import { Command } from "commander";
import { addJsonFlag, printOutput } from "../shared.js";
import { startRecallHttpBackendServer } from "../../backend/RecallHttpBackend.js";

export function registerBackendCommands(program: Command): void {
  addJsonFlag(
    program
      .command("backend")
      .description("Operate the Recall HTTP backend")
      .command("serve")
      .description("Run a lightweight persistent recall-http backend")
      .option("--port <port>", "Port to listen on", "4546")
      .option("--data-dir <dir>", "Directory used to persist memory spaces", ".recall-http-backend")
      .option("--api-key <key>", "Optional bearer token required by the backend")
      .action(async function action() {
        const options = this.opts();
        const port = Number(options.port);
        const server = await startRecallHttpBackendServer({
          dataDir: options.dataDir,
          port,
          apiKey: options.apiKey,
        });
        printOutput(this, {
          ok: true,
          mode: "recall-http",
          port,
          dataDir: options.dataDir,
          protected: Boolean(options.apiKey),
          healthUrl: `http://127.0.0.1:${port}/health`,
        });
        await new Promise<void>((resolve) => {
          server.on("close", () => resolve());
        });
      }),
  );
}
