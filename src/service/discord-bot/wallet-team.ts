import { ChannelType, Client, Message } from "discord.js";
import { WebClient } from "@slack/web-api";
import { Logger } from "pino";

const WALLET_KEYWORDS = [
  "freighter",
  "soroban-react-payment",
  "soroban-react-mint-token",
  "soroban-react-atomic-swap",
];
const SLACK_POST_CHANNEL = "C07874YGQV8";

export const walletTeamWatchMessages = async (
  message: Message,
  discordClient: Client,
  slackClient: WebClient,
  logger: Logger
) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  const messageContent = message.content.toLowerCase();
  const containsKeyword = WALLET_KEYWORDS.some((keyword) => messageContent.includes(keyword.toLowerCase()));

  if (containsKeyword) {
    const channel = await discordClient.channels.fetch(message.channelId);
    const channelName = channel && channel.type === ChannelType.GuildText ? channel.name : message.channelId;
    const res = await slackClient.chat.postMessage({
      channel: SLACK_POST_CHANNEL,
      text: `channel: *${channelName}*, from *${message.author.username}*:
${message.content}
      `,
    });

    if (!res.ok) {
      logger.error("Failed to post to slack");
      logger.error(res.errors);
    }
  }
};
