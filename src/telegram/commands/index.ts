import type { Interaction } from '../interaction.type';

import { startCommand } from './start.command';

type Command = (interaction: Interaction) => unknown;
export const commands = new Map<string, Command>([
  ['start', startCommand],
]);

export default commands;
