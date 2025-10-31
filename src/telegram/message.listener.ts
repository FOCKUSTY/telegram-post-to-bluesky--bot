import type { Interaction } from "./interaction.type";

import BlueskyApi from "../bluesky";

const enum EnvKeys {
  id = "TELEGRAM_CHANNEL_ID",
  url = "TELEGRAM_CHANNEL_URL"
}

const env = process.env as Record<EnvKeys, string>;

const REQUIRED_ENV_KEYS = [
  EnvKeys.id,
  EnvKeys.url
];

const isAllKeysInEnv = REQUIRED_ENV_KEYS.every(key => env[key]);
if (!isAllKeysInEnv) {
  throw new Error("Bad env");
};

const POINTS = "...";
const ADDITIONAL_TEXT_STR ="Из Telegram: " + env[EnvKeys.url]
const ADDITIONAL_TEXT = "\n\n" + ADDITIONAL_TEXT_STR;
const MAX_LENGTH = 300;
const MAX_TEXT_LENGTH = 300 - ADDITIONAL_TEXT.length;

export type Image = {
  dataUri: string,
  alt: string,
  width: string,
  height: string
}

export const getText = async (interaction: Interaction) => {
  const chat = interaction.update.channel_post.chat;

  if (chat.id.toString() !== env[EnvKeys.id]) {
    return;
  }

  const text = interaction.update.channel_post.text || interaction.update.channel_post.caption;

  if (!text) {
    return ADDITIONAL_TEXT_STR;
  }

  let output: string = text + ADDITIONAL_TEXT;

  const length = text.length + ADDITIONAL_TEXT.length;
  if (length > MAX_LENGTH) {
    output = text.slice(0, MAX_TEXT_LENGTH - POINTS.length) + POINTS + ADDITIONAL_TEXT;
  };

  return output;
};

export const getAttacment = async (interaction: Interaction): Promise<Image|null> => {
  const chat = interaction.update.channel_post.chat;

  if (chat.id.toString() !== env[EnvKeys.id]) {
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
  
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const dataUri = `data:${contentType};base64,${base64}`;

  return {
    dataUri,
    alt: interaction.update.channel_post.caption || 'Image from Telegram',
    width: largestPhoto.width,
    height: largestPhoto.height, 
  };
};

const attachments = new Map<number, {
  timeout: NodeJS.Timeout,
  resolve: () => unknown,
  images: Image[],
  text: string
}>();
export const resolveManygetAttacments = (interaction: Interaction, text?: string) => {
  return new Promise<{ attachments: Image[], text?: string, skip?: boolean, end?: boolean }>((resolve) => {
    (async () => {
      const attachment = await getAttacment(interaction);
      const id = interaction.update.channel_post.media_group_id;
    
      if (!attachment) {
        return resolve({ attachments: [], text, end: true });
      }

      if (!id) {
        return resolve({ attachments: [attachment], text, end: true });
      };

      const data = attachments.get(id);
      clearTimeout(data?.timeout);
      data?.resolve();

      const images = [ ...(data?.images || []), attachment ];
      const timeout = setTimeout(() => {
        resolve({ attachments: images, end: true, text: data?.text, skip: false });
      }, 5000);

      attachments.set(id, { text: data?.text || text || ADDITIONAL_TEXT_STR, images, timeout, resolve: () => {
        resolve({ attachments: images, skip: true, text: data?.text, end: false });
      }});
    })();
  })
}

export const listener = async (interaction: Interaction) => {
  const text = await getText(interaction);
  const data = await resolveManygetAttacments(interaction, text === ADDITIONAL_TEXT_STR ? undefined : text);

  if (data.skip) {
    return;
  }

  if (!data.end || !data.text) {
    return;
  };

  new BlueskyApi().post({
    text: data.text,
    images: data.attachments
  });
}

export default listener;
