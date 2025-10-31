import type { Image } from "../telegram/message.listener";
import type { Main } from "@atproto/api/dist/client/types/app/bsky/embed/images";

import { RichText } from '@atproto/api'
import agent from "./bluesky.agent";

function convertDataURIToUint8Array(dataURI: string): Uint8Array {
  const base64 = dataURI.split(',')[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}

async function getImages(attachments?: Image[]): Promise<Main["images"]> {
  if (!attachments) {
    return [];
  }

  const output: Main["images"] = [];

  for (const attachment of attachments) {
    const { data } = await agent.uploadBlob(
      convertDataURIToUint8Array(attachment.dataUri), 
      {
        encoding: attachment.dataUri.split(';')[0].split(':')[1]
      }
    );
    output.push({
      alt: attachment.alt,
      image: data.blob
    });
  }

  return output;
}

export class Bluesky {
  public readonly maxTextLength: number = 300;

  public async post({ text, images }: { text: string, images?: Image[] }): Promise<unknown> {
    const richText = new RichText({ text });

    await richText.detectFacets(agent);

    return agent.post({
      text: richText.text,
      facets: richText.facets,
      embed: {
        $type: "app.bsky.embed.images",
        images: await getImages(images)
      },
      createdAt: new Date().toISOString()
    });
  }

  public put(): Promise<unknown> {
    throw new Error("PUT method is not possible");
  }
  
  public delete({ id }: { id: string }): Promise<unknown> {
    throw new Error(JSON.stringify({id}));
  }
}

export default Bluesky;
