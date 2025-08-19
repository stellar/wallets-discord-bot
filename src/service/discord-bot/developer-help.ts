import { ChannelType, Client, Message } from "discord.js";
import { WebClient } from "@slack/web-api";
import { Logger } from "pino";

const DISCORD_CHANNEL = "1037066367326752818"; // #developer-help in Discord
const SLACK_POST_CHANNEL = "C08HHHVCSK1"; // #discord-developer-help in Slack

export const developerHelpWatchMessages = async (
  message: Message,
  discordClient: Client,
  slackClient: WebClient,
  logger: Logger
) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  if (message.channelId == DISCORD_CHANNEL) {
    const channel = await discordClient.channels.fetch(message.channelId);
    const channelName = channel && channel.type === ChannelType.GuildText ? channel.name : message.channelId;
    const res = await slackClient.chat.postMessage({
      channel: SLACK_POST_CHANNEL,
      text: `channel: *${channelName}*, from *${message.author.username}*, [thread](${message.url}):
${message.content}
      `,
    });

    if (!res.ok) {
      logger.error("Failed to post to slack");
      logger.error(res.errors);
    }
  }
};
