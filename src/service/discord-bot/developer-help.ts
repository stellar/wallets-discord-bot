import {
  ChannelType,
  Client,
  Message,
  TextChannel,
  ThreadChannel,
} from "discord.js";
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

  if (
    message.channelId == DISCORD_CHANNEL ||
    (message.channel?.isThread() &&
      message.channel.parentId === DISCORD_CHANNEL)
  ) {
    const channel = await discordClient.channels.fetch(message.channelId);

    let channelName: string;
    if (channel?.type === ChannelType.GuildText) {
      channelName = (channel as TextChannel).name;
    } else if (channel?.isThread()) {
      const thread = channel as ThreadChannel;
      const parentName =
        thread.parent?.type === ChannelType.GuildText
          ? thread.parent.name
          : "unknown";
      channelName = `${parentName} > ${thread.name}`;
    } else {
      channelName = message.channelId;
    }

    const res = await slackClient.chat.postMessage({
      channel: SLACK_POST_CHANNEL,
      text: `channel: *${channelName}*, from *${message.author.username}*, <${message.url}|thread>:
${message.content}
      `,
    });

    if (!res.ok) {
      logger.error("Failed to post to slack");
      logger.error(res.errors);
    }
  }
};
