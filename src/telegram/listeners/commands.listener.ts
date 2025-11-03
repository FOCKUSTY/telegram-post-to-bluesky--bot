import { UpdateType } from "telegraf/typings/telegram-types";
import commands from "../commands";
import { Interaction } from "../interaction.type";

export const AVAILABLE_INTERACTIONS: UpdateType[] = [
  "message",
];

export const commandsListener = (interaction: Interaction) => {
  if (!interaction.text?.startsWith("/")) {
    return;
  };

  const available = AVAILABLE_INTERACTIONS.includes(interaction.updateType);
  if (!available) {
    return;
  };

  const commandName = interaction.text.split(" ")[0].substring(1);
  const command = commands.get(commandName);

  if (!command) {
    return interaction.reply("Unknown command: " + commandName);
  };
  
  command(interaction);
}

export default commandsListener;
