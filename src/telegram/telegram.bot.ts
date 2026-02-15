import { Telegraf } from "telegraf";
import {
  channelPostListener,
  commandsListener,
  messageListener,
  groupMessageListener
} from "./listeners";

import env from "@env";

export const client = new Telegraf(env.TELEGRAM_BOT_TOKEN);

const registryTime = Date.now() / 1000;
const isInteractionValided = (date: number) => registryTime <= date;

client.on("message", async (interaction) => {
  if (!isInteractionValided(interaction.message.date)) {
    return;
  }

  commandsListener(interaction);
  messageListener(interaction);
  groupMessageListener(interaction);
});

client.on("channel_post", async (interaction) => {
  console.log("POST");
  if (!isInteractionValided(interaction.update.channel_post.date)) {
    return;
  }

  channelPostListener(interaction);
});

export const login = async () => {
  await client.launch(() => {
    console.log("Loggined as:", client.botInfo?.username);
  });
};

export default client;
