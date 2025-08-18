import { Client, Events, GatewayIntentBits } from "discord.js";
import { WebClient } from "@slack/web-api";
import { Logger } from "pino";

import { walletTeamWatchMessages } from "./wallet-team";

export const watchMessages = async (discordToken: string, slackToken: string, logger: Logger) => {
  const discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  })
  const slackClient = new WebClient(slackToken)

  discordClient.once(Events.ClientReady, readyClient => {
    logger.info(`Logged in as ${readyClient.user.tag}`)
  })

  discordClient.on('messageCreate', async (message) => {
    return Promise.all([walletTeamWatchMessages(message, discordClient, slackClient, logger)]);
  })

  discordClient.login(discordToken)
}
