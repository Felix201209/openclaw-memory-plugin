import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { resolvePluginConfig } from "../config/loader.js";
import { runtimePluginConfigSchema } from "../config/schema.js";
import { createInspectHttpHandler } from "../inspect/http.js";
import { registerPluginHooks } from "./hooks.js";
import { getOrCreatePluginContainer } from "./runtime-state.js";

const plugin = {
  id: "openclaw-recall",
  name: "OpenClaw Recall",
  description:
    "Persistent memory, context compression, and profile visibility for OpenClaw.",
  configSchema: runtimePluginConfigSchema,
  register(api: OpenClawPluginApi) {
    const stateDir = api.runtime.state.resolveStateDir();
    const resolved = resolvePluginConfig({
      pluginConfig: api.pluginConfig as Record<string, unknown> | undefined,
      openclawHome: stateDir,
    });
    const container = getOrCreatePluginContainer({
      config: resolved,
      logger: api.logger,
    });

    api.registerService({
      id: "openclaw-recall",
      start: () => {
        api.logger.info(
          `[openclaw-recall] ready: db=${container.database.path} route=${resolved.inspect.httpPath}`,
        );
      },
    });

    api.registerHttpRoute({
      path: resolved.inspect.httpPath,
      auth: "plugin",
      match: "prefix",
      handler: createInspectHttpHandler({
        basePath: resolved.inspect.httpPath,
        container,
      }),
    });

    api.registerCli(
      async ({ program }) => {
        const [{ registerMemoryCommands }, { registerProfileCommands }, { registerDoctorCommands }, { registerConfigCommands }, { registerStatusCommands }, { registerSessionCommands }] =
          await Promise.all([
            import("../cli/commands/memory.js"),
            import("../cli/commands/profile.js"),
            import("../cli/commands/doctor.js"),
            import("../cli/commands/config.js"),
            import("../cli/commands/status.js"),
            import("../cli/commands/session.js"),
          ]);
        const sub = program.command("recall").description("Inspect OpenClaw Recall");
        registerStatusCommands(sub);
        registerDoctorCommands(sub);
        registerMemoryCommands(sub);
        registerProfileCommands(sub);
        registerSessionCommands(sub);
        registerConfigCommands(sub);
      },
      { commands: ["recall"] },
    );

    registerPluginHooks(api, container);
  },
};

export default plugin;
