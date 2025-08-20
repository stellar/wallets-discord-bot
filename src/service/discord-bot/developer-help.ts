import { ChannelType, Client, Message, TextChannel } from "discord.js";
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
  // Ignore messages from bots and replies
  if (message.author.bot) return;
  if (message.reference) return;

  if (message.channelId !== DISCORD_CHANNEL) return;

  const channel = await discordClient.channels.fetch(message.channelId);
  const channelName =
    channel?.type === ChannelType.GuildText
      ? (channel as TextChannel).name
      : message.channelId;

  const res = await slackClient.chat.postMessage({
    channel: SLACK_POST_CHANNEL,
    text: `channel: *${channelName}*, from *${message.author.username}*, <${message.url}|post>:
${message.content}`,
  });

  if (!res.ok) {
    logger.error("Failed to post to slack");
    logger.error(res.errors);
  }
};
