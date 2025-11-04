import { UpdateType } from "telegraf/typings/telegram-types";
import { Interaction } from "../interaction.type";

import prisma from "@database";
import { sliceText } from "./channel-post.listener";
import BlueskyApi from "../../bluesky";
import env from "@env";

export const AVAILABLE_INTERACTIONS: UpdateType[] = ["message"];

const createBlueskyInstance = async (channel: {
  blueskyId: string
  blueskyPassword: string
}) => BlueskyApi.createInstance(channel.blueskyId, channel.blueskyPassword)

const findChannelAndCreateBlueskyInstance = async (id: string) => {
  const prismaChannel = await prisma.channel.findUnique({
    where: { id: id }
  });

  if (!prismaChannel) {
    return null;
  }

  return createBlueskyInstance(prismaChannel);
}

const findThenCreateOrUpdateThread = async (id: string) => {
  const thread = await prisma.thread.findUnique({
    where: { id }
  });

  return {
    thread,
    createOrUpdateThread: ({
      channelId,
      cid,
      uri
    }: {
      uri: string,
      cid: string,
      channelId: string
    }) => {
      if (!thread) {
        return prisma.thread.create({
          data: {
            id, uri, cid, channelId,
            expiresAt: new Date(Date.now() + +env.TIME_TO_LIVE),
          }
        })
      }

      return prisma.thread.update({
        where: { id },
        data: { uri, cid, channelId }
      })
    }
  }
};

const comment = async ({
  channelId,
  threadId,
  message
}: {
  threadId: string,
  channelId?: string,
  message: {
    uri?: string,
    cid?: string,
    text: string
  }
}) => {
  const { thread, createOrUpdateThread } = await findThenCreateOrUpdateThread(threadId);

  const id = channelId || thread?.channelId;
  if (!id) {
    return console.log("Channel ID not found for thread:", threadId);
  }

  const bluesky = await findChannelAndCreateBlueskyInstance(id);
  if (!bluesky) {
    return;
  }

  const uri = message?.uri || thread?.uri;
  const cid = message?.cid || thread?.cid;
  if (!uri || !cid) {
    return console.log("URI or CID not found for thread:", threadId);
  }

  await createOrUpdateThread({
    uri, cid, channelId: id
  });

  return bluesky.comment(
    uri,
    cid,
    message.text
  );
}

export const groupMessageListener = async (interaction: Interaction) => {
  const text = interaction.text;
  if (!text) {
    return;
  }

  if (text.startsWith("/")) {
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
  const messageId = `${channelId}-${reply.forward_from_message_id}`;
  const channelIdAvailable = reply?.forward_origin?.type === "channel";
  const name = interaction.message.from.first_name === "Telegram"
    ? ""
    : `(${interaction.message.from.username || interaction.message.from.first_name}) `;
  const slicedText = sliceText(name + text);

  const prismaMessage = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (prismaMessage) {
    return comment({
      message: {
        text: slicedText,
        ...prismaMessage,
      },
      threadId: threadId,
      channelId: channelIdAvailable
        ? channelId
        : undefined
    });
  };

  const { thread } = await findThenCreateOrUpdateThread(threadId);
  if (!thread) {
    return console.log("Thread not found:", threadId);
  }

  const prismaChannel = await prisma.channel.findUnique({
    where: { id: channelIdAvailable ? channelId : thread.channelId }
  });

  if (!prismaChannel) {
    return console.log("Channel not found:", channelIdAvailable ? channelId : thread.channelId);
  }
  if (!prismaChannel.commentsEnabled) {
    return console.log("Comments not enabled for channel:", prismaChannel.id);
  }
  if (!prismaChannel.enabled) {
    return console.log("Channel not enabled:", prismaChannel.id);
  }

  const bluesky = await createBlueskyInstance(prismaChannel);
  if (!bluesky) {
    return console.log("Bluesky instance could not be created for channel:", prismaChannel.id);
  }

  await bluesky.comment(
    thread.uri,
    thread.cid,
    slicedText
  );
};

export default groupMessageListener;
