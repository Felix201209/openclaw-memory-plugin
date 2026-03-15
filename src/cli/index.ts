#!/usr/bin/env node
import { Command } from "commander";
import { registerConfigCommands } from "./commands/config.js";
import { registerDoctorCommands } from "./commands/doctor.js";
import { registerMemoryCommands } from "./commands/memory.js";
import { registerProfileCommands } from "./commands/profile.js";
import { registerSessionCommands } from "./commands/session.js";
import { registerStatusCommands } from "./commands/status.js";

const program = new Command();

program
  .name("openclaw-recall")
  .description("Inspect and operate OpenClaw Recall")
  .version("1.0.0");

registerStatusCommands(program);
registerDoctorCommands(program);
registerMemoryCommands(program);
registerProfileCommands(program);
registerSessionCommands(program);
registerConfigCommands(program);

await program.parseAsync(process.argv);
