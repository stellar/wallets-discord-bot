import { ChannelType, Client, Events, GatewayIntentBits } from "discord.js";
import { WebClient } from "@slack/web-api";
import { Logger } from "pino";

import { SLACK_POST_CHANNEL, WALLET_KEYWORDS } from "../../helper/discord-bot";

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
    // Ignore messages from bots
    if (message.author.bot) return;
  
    const messageContent = message.content.toLowerCase();
    const containsKeyword = WALLET_KEYWORDS.some(keyword => messageContent.includes(keyword.toLowerCase()));

    if (containsKeyword) {
      const channel = await discordClient.channels.fetch(message.channelId);
      const channelName = channel && channel.type === ChannelType.GuildText ? channel.name : message.channelId
      const res = await slackClient.chat.postMessage({
        channel: SLACK_POST_CHANNEL,
        text: `channel: *${channelName}*, from *${message.author.username}*:
${message.content}
        `
      });

      if (!res.ok) {
        logger.error('Failed to post to slack')
        logger.error(res.errors)
      }
    }
  });

  discordClient.login(discordToken)
}