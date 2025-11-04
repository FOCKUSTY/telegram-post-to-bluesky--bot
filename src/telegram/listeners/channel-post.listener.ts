import type { Interaction } from "../interaction.type";

import prisma from "@database";

import BlueskyApi from "../../bluesky";

const POINTS = "...";
const MAX_LENGTH = 300;

export type Image = {
  dataUri: string;
  alt: string;
  width: string;
  height: string;
};

type Channel = {
  id: string;
  userId: string;
  url: string | null;
  blueskyId: string;
  blueskyPassword: string;
  commentsEnabled: boolean;
  enabled: boolean;
  verified: boolean;
};

export const sliceText = (text: string, additional: string = "") => {
  const MAX_TEXT_LENGTH = 300 - additional.length;

  let output: string = text + additional;
  
  const length = text.length + additional.length;
  if (length > MAX_LENGTH) {
    output =
      text.slice(0, MAX_TEXT_LENGTH - POINTS.length) + POINTS + additional;
  }

  return output;
}

const generateText = (text: string, channel: Channel) => {
  const additional = channel.url
    ? "Из Telegram: " + channel.url
    : "Из Telegram";

  const ADDITIONAL_TEXT = text === ""
    ? additional
    : "\n\n" + additional;

  return sliceText(text, ADDITIONAL_TEXT);
};

export const getText = async (interaction: Interaction, channel: Channel, message?: string) => {
  const chat = interaction.update.channel_post.chat;

  if (chat.id.toString() !== channel.id) {
    return;
  }

  const text =
    message ||
    interaction.update.channel_post.text ||
    interaction.update.channel_post.caption;

  return generateText(text || "", channel);
};

export const getAttacment = async (
  interaction: Interaction,
  channel: Channel
): Promise<Image | null> => {
  const chat = interaction.update.channel_post.chat;

  if (chat.id.toString() !== channel.id) {
    return null;
  }

  const photos = interaction.update.channel_post.photo;

  if (!photos || photos.length === 0) {
    return null;
  }

  const largestPhoto = photos[photos.length - 1];
  const fileId = largestPhoto.file_id;

  const fileUrl = await interaction.telegram.getFileLink(fileId);

  const response = await fetch(fileUrl.href);
  const arrayBuffer = await response.arrayBuffer();

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${contentType};base64,${base64}`;

  return {
    dataUri,
    alt: interaction.update.channel_post.caption || "Image from Telegram",
    width: largestPhoto.width,
    height: largestPhoto.height
  };
};

const attachments = new Map<
  string,
  {
    timeout: NodeJS.Timeout;
    resolve: () => unknown;
    images: Image[];
    text: string;
    ids: string[];
  }
>();
export const resolveManyAttacments = (
  interaction: Interaction,
  channel: Channel,
  text?: string,
) => {
  return new Promise<{
    attachments: Image[];
    text: string;
    end?: boolean;
    ids: string[];
  }>((resolve) => {
    (async () => {
      const attachment = await getAttacment(interaction, channel);
      const groupId = interaction.update.channel_post.media_group_id;
      const chatId = interaction.update.channel_post.chat.id;
      
      if (!attachment) {
        return resolve({ attachments: [], text: "", end: true, ids: [ interaction.update.channel_post.message_id ] });
      }
      
      if (!groupId) {
        return resolve({ attachments: [attachment], text: "", end: true, ids: [interaction.update.channel_post.message_id ] });
      }

      const id = `${chatId}-${groupId}`;
      const data = attachments.get(id);
      
      clearTimeout(data?.timeout);
      data?.resolve();

      const images = [...(data?.images || []), attachment];
      const ids = [ ...(data?.ids||[]), interaction.update.channel_post.message_id ];
      const timeout = setTimeout(() => {
        resolve({
          attachments: images,
          end: true,
          text: data?.text || "",
          ids: ids
        });
      }, 5000);

      attachments.set(id, {
        text: data?.text || text || "",
        images,
        timeout,
        ids: ids,
        resolve: () => {
          resolve({
            attachments: images,
            text: data?.text || "",
            end: false,
            ids: ids
          });
        }
      });
    })();
  });
};

export const verifyAndUpdateOrDeleteChannel = async ({
  interaction,
  channel
}: {
  interaction: Interaction,
  channel: Channel
}) => {
  const chat = interaction.update.channel_post.chat;
  const administrators = await interaction.getChatAdministrators();
  const available = administrators.some((admin) => admin.status === "creator" && `${admin.user.id}` === channel.userId);

  if (!available) {
    prisma.channel.delete({
      where: {
        id: channel.id
      }
    });
    
    interaction.telegram.sendMessage(
      channel.userId,
      `Канал ${chat.title} был отключен, так как бот не смог подтвердить ваши права создателя в этом канале. Пожалуйста, обратитесь к создателю канала для подключения бота.`
    );

    return false;
  }

  console.log("Channel verified:", chat.id);

  await prisma.channel.update({
    where: {
      id: channel.id
    },
    data: {
      verified: true
    }
  });

  console.log("Channel updated as verified:", chat.id);

  return true;
}

export const getPrismaChannel = async (interaction: Interaction) => {
  const chat = interaction.update.channel_post.chat;
  const channel = await prisma.channel.findUnique({
    where: {
      id: `${chat.id}`
    }
  });

  console.log("Validating channel:", chat.id);
  if (!channel) {
    console.log("Channel not found:", chat.id);
    return null;
  }

  if (!channel.enabled) {
    console.log("Chat is disabled:", chat.id);
    return null;
  }

  if (channel.verified) {
    console.log("Channel validated:", chat.id);
    return channel;
  }

  const verified = await verifyAndUpdateOrDeleteChannel({ interaction, channel });
  if (!verified) {
    console.log("Channel is not verified:", chat.id);
    return null;
  }

  return channel;
};

export const channelPostListener = async (interaction: Interaction) => {
  const prismaChannel = await getPrismaChannel(interaction);
  if (!prismaChannel) {
    return;
  }

  const data = await resolveManyAttacments(
    interaction,
    prismaChannel,
    interaction.update.channel_post.text || interaction.update.channel_post.caption
  );

  if (!data.end) {
    return;
  }
  
  const message = await getText(interaction, prismaChannel, data.text);
  if (!message) {
    return;
  }

  const api = await BlueskyApi.createInstance(prismaChannel.blueskyId, prismaChannel.blueskyPassword);
  if (!api) {
    return;
  }

  const chatId = `${interaction.channelPost.chat.id}`;
  const postData = await api.post({
    images: data.attachments,
    text: message,
  });

  await prisma.message.createMany({
    data: data.ids.map(id => ({
      id: `${chatId}-${id}`,
      uri: postData.uri,
      cid: postData.cid
    }))
  });
};

export default channelPostListener;
