import * as dotEnv from "dotenv";
import { expand } from "dotenv-expand";

import { logger } from "./logger";
import { buildConfig } from "./config";
import { watchMessages } from "./service/discord-bot";

async function main() {
  const _config = dotEnv.config({ path: ".env" });
  expand(_config);

  const config = _config.parsed || {};
  const conf = buildConfig(config);

  try {
    await watchMessages(conf.discordAppToken, conf.slackToken, logger)
  } catch (error) {
    logger.error(error)
    process.exit(1);
  }

  process.on("SIGTERM", async () => {
    process.exit(0);
  });

  process.on("SIGINT", function () {
    process.exit(0);
  });
}

process.on("uncaughtException", function (err) {
  logger.error(err);
  process.kill(process.pid, "SIGTERM");
});

process.on("unhandledRejection", function (reason: string) {
  logger.error(reason);
});

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});