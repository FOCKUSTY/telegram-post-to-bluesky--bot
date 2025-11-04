import { UpdateType } from "telegraf/typings/telegram-types";
import { Interaction } from "../interaction.type";

import prisma from "@database";

export const AVAILABLE_INTERACTIONS: UpdateType[] = ["message"];

export const groupMessageListener = async (interaction: Interaction) => {
  if (interaction.text?.startsWith("/")) {
    return;
  }

  const available = AVAILABLE_INTERACTIONS.includes(interaction.updateType);
  if (!available) {
    return;
  }

  if (interaction.message.chat.type !== "supergroup") {
    return;
  }

  const reply = interaction.update.message.reply_to_message;
  if (!reply) {
    return;
  }

  const message = interaction.update.message;
  const channelId = `${reply?.forward_from_chat?.id}`;
  const threadId = `${reply.chat.id}-${message.message_thread_id}`;
  const messageId = `${reply.chat.id}-${reply.message_id}`;

  let prismaMessage = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (!prismaMessage) {
    prismaMessage = await prisma.message.create({
      data: {
        id: messageId,
        threadId: threadId,
      }
    });
  }

  if (reply?.forward_origin?.type === "channel") {
    const prismaChannel = await prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!prismaChannel) {
      return;
    }

    if (!prismaChannel.commentsEnabled) {
      return;
    }

    if (!prismaChannel.enabled) {
      return;
    }

    const thread = await prisma.thread.findUnique({
      where: { threadId }
    });

    if (!thread) {
      return;
    }
  }

  const thread = await prisma.thread.findUnique({
    where: { threadId }
  });

  if (!thread) {
    return;
  }
  
  return;
};

export default groupMessageListener;
