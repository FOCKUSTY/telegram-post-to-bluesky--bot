import { Telegraf } from "telegraf";
import {
  channelPostListener,
  commandsListener,
  messageListener,
  groupMessageListener
} from "./listeners";

import env from "@env";

export const client = new Telegraf(env.TELEGRAM_BOT_TOKEN);

client.on("message", async (interaction) => {
  commandsListener(interaction);
  messageListener(interaction);
  groupMessageListener(interaction);
});

client.on("channel_post", async (interaction) => {
  channelPostListener(interaction);
});

export const login = async () => {
  await client.launch();
};

export default client;
