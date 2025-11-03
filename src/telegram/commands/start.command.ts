import { Interaction } from "../interaction.type";

export const startCommand = (interaction: Interaction) => {
  return interaction.reply("Welcome! How can I assist you today?");
};

export default startCommand;
