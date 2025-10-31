import { AtpAgent } from '@atproto/api'

export const agent = new AtpAgent({
  service: "https://bsky.social"
});

const enum EnvKeys {
  identifier = "BLUESKY_USERNAME",
  password = "BLUESKY_PASSWORD"
};

const env = process.env as Record<EnvKeys, string>;

const REQUIRED_ENV_KEYS = [
  EnvKeys.identifier,
  EnvKeys.password,
];

const isAllKeysInEnv = REQUIRED_ENV_KEYS.every(key => env[key]);
if (!isAllKeysInEnv) {
  throw new Error("Bad env");
};

export const login = async () => {
  const data = await agent.login({
    identifier: env[EnvKeys.identifier],
    password: env[EnvKeys.password],
  });

  console.log((data.success
    ? "Получилось"
    : "Не получилось"
  ) + " подключиться к агенту Bluesky");

  return data;
}


export default agent;