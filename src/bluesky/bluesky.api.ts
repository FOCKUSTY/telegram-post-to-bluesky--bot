import type { Image } from "../telegram/listeners/channel-post.listener";
import type { Main } from "@atproto/api/dist/client/types/app/bsky/embed/images";

import { RichText, AtpAgent } from "@atproto/api";
import { login } from "./bluesky.agent";

function convertDataURIToUint8Array(dataURI: string): Uint8Array {
  const base64 = dataURI.split(",")[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}

async function getImages(agent: AtpAgent, attachments?: Image[]): Promise<Main["images"]> {
  if (!attachments) {
    return [];
  }

  const output: Main["images"] = [];

  for (const attachment of attachments) {
    const { data } = await agent.uploadBlob(
      convertDataURIToUint8Array(attachment.dataUri),
      {
        encoding: attachment.dataUri.split(";")[0].split(":")[1]
      }
    );
    output.push({
      alt: "Image from Telegram",
      image: data.blob
    });
  }

  return output;
}

export class Bluesky {
  public readonly maxTextLength: number = 300;

  public static login = login;
  public static createInstance = async (username: string, password: string) => {
    const { data, agent } = await login(username, password);

    if (!data) {
      return null;
    } 

    return new Bluesky(agent);
  }

  public constructor(public readonly agent: AtpAgent = new AtpAgent({ service: "https://bsky.social" })) {}

  public async post({
    text,
    images
  }: {
    text: string;
    images?: Image[];
  }): Promise<unknown> {
    const richText = new RichText({ text });

    await richText.detectFacets(this.agent);

    return this.agent.post({
      text: richText.text,
      facets: richText.facets,
      embed: {
        $type: "app.bsky.embed.images",
        images: await getImages(this.agent, images)
      },
      createdAt: new Date().toISOString()
    });
  }
}

export default Bluesky;
