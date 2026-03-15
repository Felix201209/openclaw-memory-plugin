import path from "node:path";
import { resolveOpenClawHome } from "../config/loader.js";

export function resolvePluginPaths(env: NodeJS.ProcessEnv = process.env): {
  openclawHome: string;
  pluginRoot: string;
  databasePath: string;
} {
  const openclawHome = resolveOpenClawHome(env);
  const pluginRoot = path.join(openclawHome, "plugins", "openclaw-recall");
  return {
    openclawHome,
    pluginRoot,
    databasePath: path.join(pluginRoot, "memory.sqlite"),
  };
}
