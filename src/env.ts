const REQUIRED_ENV_KEYS = [
  "TELEGRAM_BOT_TOKEN",
  "TIME_TO_LIVE"
] as const;

type ArrayElement<T extends unknown[] | readonly unknown[]> = T[number];

const ALL = [...REQUIRED_ENV_KEYS] as const;

type EnvKeys = ArrayElement<typeof ALL>;
type Env = Record<EnvKeys, string>;

export const env = process.env as Env;

const isAllKeysInEnv = REQUIRED_ENV_KEYS.every((key) => env[key]);
if (!isAllKeysInEnv) {
  throw new Error("Bad env");
}

export default env;
