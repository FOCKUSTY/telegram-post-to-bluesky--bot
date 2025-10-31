import { Telegraf } from "telegraf";

import { messageListener } from "./listeners.bot";

const enum EnvKeys {
  token = "TELEGRAM_BOT_TOKEN"
}

const env = process.env as Record<EnvKeys, string>;

const REQUIRED_ENV_KEYS = [
  EnvKeys.token,
];

const isAllKeysInEnv = REQUIRED_ENV_KEYS.every(key => env[key]);
if (!isAllKeysInEnv) {
  throw new Error("Bad env");
};

export const client = new Telegraf(env[EnvKeys.token]);

client.on("channel_post", async (interaction) => {
  messageListener(interaction);
});

export const login = async () => {
  await client.launch();

  process.once("SIGINT", () => client.stop("SIGINT"));
  process.once("SIGTERM", () => client.stop("SIGTERM"));
}

export default client;
