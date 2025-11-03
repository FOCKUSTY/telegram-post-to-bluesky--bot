import { Telegraf } from "telegraf";
import { messageListener } from "./listeners.bot";

import env from "@env";

export const client = new Telegraf(env.TELEGRAM_BOT_TOKEN);

client.on("channel_post", async (interaction) => {
  messageListener(interaction);
});

export const login = async () => {
  await client.launch();

  process.once("SIGINT", () => client.stop("SIGINT"));
  process.once("SIGTERM", () => client.stop("SIGTERM"));
}

export default client;
