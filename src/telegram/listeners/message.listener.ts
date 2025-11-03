import { UpdateType } from "telegraf/typings/telegram-types";
import { Interaction } from "../interaction.type";

export const AVAILABLE_INTERACTIONS: UpdateType[] = [
  "message",
];

export const messageListener = (interaction: Interaction) => {
  if (interaction.text?.startsWith("/")) {
    return;
  };

  const available = AVAILABLE_INTERACTIONS.includes(interaction.updateType);
  if (!available) {
    return;
  };

  const origin = interaction.message.forward_origin;
  if (!origin) {
    return;
  }

  if (interaction.message.chat.type !== "private") {
    return;
  }

  if (origin.type !== "channel") {
    return interaction.reply("Переотправка сообщений возможна только из каналов.");
  }

  return interaction.reply(origin.chat.id);
}

export default messageListener;
