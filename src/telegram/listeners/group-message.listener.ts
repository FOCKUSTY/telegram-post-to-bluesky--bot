import { UpdateType } from "telegraf/typings/telegram-types";
import { Interaction } from "../interaction.type";

import prisma from "@database";

export const AVAILABLE_INTERACTIONS: UpdateType[] = [
  "message",
];

export const groupMessageListener = async (interaction: Interaction) => {
  if (interaction.text?.startsWith("/")) {
    return;
  };

  const available = AVAILABLE_INTERACTIONS.includes(interaction.updateType);
  if (!available) {
    return;
  };

  if (interaction.message.chat.type !== "supergroup") {
    return;
  };

  const reply = interaction.update.message.reply_to_message;
  if (!reply) {
    return;
  };

  const message = interaction.update.message;
  const channelId = reply.forward_from_chat.id;

  if (reply?.forward_origin?.type === "channel") {
    const prismaChannel = await prisma.channel.findUnique({
      where: { id: channelId}
    });

    if (!prismaChannel) {
      return;
    };

    if (!prismaChannel.commentsEnabled) {
      return;
    };
    
    if (!prismaChannel.enabled) {
      return;
    };

    prisma.thread.create({
      data: {
        telegramId: message.message_thread_id,
        channelId: channelId
      }
    });
  };

  console.log("---- [GROUP MESSAGE LISTENER] ----");
  console.dir(reply, { depth: Infinity });
  console.log("---- [GROUP MESSAGE LISTENER] ----");

  return;
}

export default groupMessageListener;
