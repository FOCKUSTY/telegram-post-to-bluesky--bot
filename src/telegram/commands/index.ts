import type { Interaction } from "../interaction.type";

import { connectCommand } from "./connect.command";
import { startCommand } from "./start.command";

type Command = (interaction: Interaction) => unknown;
export const commands = new Map<string, Command>([
  ["start", startCommand],
  ["connect", connectCommand]
]);

export default commands;
