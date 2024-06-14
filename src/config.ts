import { ERROR } from "./helper/error";

const ENV_KEYS = [
  "DISCORD_APP_ID",
  "DISCORD_PUBKEY",
  "DISCORD_TOKEN",
  "SLACK_TOKEN"
];

export function buildConfig(config: Record<string, string>) {
  const configKeys = Object.keys(config);
  const missingKeys = [] as string[];

  const isMissingKeys = ENV_KEYS.every((key) => {
    if (configKeys.includes(key) || process.env[key]) {
      return true;
    }
    missingKeys.push(key);
    return false;
  });
  if (!isMissingKeys) {
    throw new Error(ERROR.INVALID_ENV(missingKeys.join()));
  }

  return {
    discordAppId: config.DISCORD_APP_ID || process.env.DISCORD_APP_ID!,
    discordAppPubKey: config.DISCORD_PUBKEY || process.env.DISCORD_PUBKEY!,
    discordAppToken: config.DISCORD_TOKEN || process.env.DISCORD_TOKEN!,
    slackToken: config.SLACK_TOKEN || process.env.SLACK_TOKEN!,
  };
}

export type Conf = ReturnType<typeof buildConfig>;
