import { ChannelType, Client, Message } from "discord.js";
import { WebClient } from "@slack/web-api";
import { Logger } from "pino";

import { escapeSlackMrkdwn } from "../../helper/slack";
import { developerHelpWatchMessages } from "./developer-help";
import { walletTeamWatchMessages } from "./wallet-team";

const DISCORD_DEVELOPER_HELP = "1037066367326752818";

interface PostedMessage {
  channel: string;
  text: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

// Captures the outgoing chat.postMessage payload so nothing is sent anywhere.
const mockSlackClient = () => {
  const posted: PostedMessage[] = [];
  const slackClient = {
    chat: {
      postMessage: jest.fn(async (payload: PostedMessage) => {
        posted.push(payload);
        return { ok: true };
      }),
    },
  } as unknown as WebClient;

  return { slackClient, posted };
};

const mockDiscordClient = (channel: unknown) =>
  ({
    channels: { fetch: jest.fn(async () => channel) },
  } as unknown as Client);

const mockLogger = () =>
  ({ error: jest.fn(), info: jest.fn() } as unknown as Logger);

const guildTextChannel = (name: string) => ({
  type: ChannelType.GuildText,
  name,
  isThread: () => false,
});

// A top-level post in the #developer-help forum: the channel is a thread whose
// name is the post title, chosen by whoever created the post.
// `id` matches the message id so the handler treats it as the post's first
// message rather than a follow-up reply.
const forumPost = (title: string, id: string) => ({
  id,
  type: ChannelType.PublicThread,
  name: title,
  parentId: DISCORD_DEVELOPER_HELP,
  isThread: () => true,
});

const discordMessage = (overrides: Record<string, unknown>) =>
  ({
    author: { bot: false, username: "mallory" },
    channelId: "111",
    content: "",
    id: "222",
    url: "https://discord.com/channels/1/2/3",
    channel: null,
    ...overrides,
  } as unknown as Message);

describe("escapeSlackMrkdwn", () => {
  it("encodes the three mrkdwn control characters", () => {
    expect(escapeSlackMrkdwn("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
  });

  it("encodes & first so no double-encoding occurs", () => {
    expect(escapeSlackMrkdwn("&lt;")).toBe("&amp;lt;");
  });
});

describe("walletTeamWatchMessages", () => {
  it("neutralizes injected mrkdwn and disables unfurling", async () => {
    const { slackClient, posted } = mockSlackClient();
    const message = discordMessage({
      content:
        "freighter <https://evil.example.com|Stellar Docs> <!channel> heads up",
    });

    await walletTeamWatchMessages(
      message,
      mockDiscordClient(guildTextChannel("general")),
      slackClient,
      mockLogger()
    );

    expect(posted).toHaveLength(1);
    const { text, unfurl_links, unfurl_media } = posted[0];

    // No raw control characters survive from the forwarded body, so neither the
    // relabeled link nor the broadcast renders as markup.
    expect(text).toContain(
      "&lt;https://evil.example.com|Stellar Docs&gt; &lt;!channel&gt;"
    );
    expect(text).not.toContain("<https://evil.example.com|Stellar Docs>");
    expect(text).not.toContain("<!channel>");

    expect(unfurl_links).toBe(false);
    expect(unfurl_media).toBe(false);
  });

  it("keeps the bot's own header formatting intact", async () => {
    const { slackClient, posted } = mockSlackClient();
    const message = discordMessage({ content: "freighter question" });

    await walletTeamWatchMessages(
      message,
      mockDiscordClient(guildTextChannel("general")),
      slackClient,
      mockLogger()
    );

    expect(posted[0].text).toBe(
      "channel: *general*, from *mallory*:\nfreighter question"
    );
  });

  it("escapes the channel name, which the template should not have to trust", async () => {
    const { slackClient, posted } = mockSlackClient();
    const message = discordMessage({ content: "freighter question" });

    await walletTeamWatchMessages(
      message,
      mockDiscordClient(
        guildTextChannel("general<https://evil.example.com|docs>")
      ),
      slackClient,
      mockLogger()
    );

    const { text } = posted[0];
    expect(text).toContain("general&lt;https://evil.example.com|docs&gt;");
    expect(text).not.toContain("<https://evil.example.com|docs>");
  });
});

describe("developerHelpWatchMessages", () => {
  it("escapes the forum post title, which the poster controls", async () => {
    const { slackClient, posted } = mockSlackClient();
    const title = "<https://evil.example.com|URGENT: verify your wallet>";
    const message = discordMessage({
      channelId: "333",
      id: "333",
      channel: forumPost(title, "333"),
      content: "please help",
    });

    await developerHelpWatchMessages(
      message,
      mockDiscordClient(forumPost(title, "333")),
      slackClient,
      mockLogger()
    );

    expect(posted).toHaveLength(1);
    const { text, unfurl_links, unfurl_media } = posted[0];

    expect(text).toContain(
      "&lt;https://evil.example.com|URGENT: verify your wallet&gt;"
    );
    expect(text).not.toContain(
      "<https://evil.example.com|URGENT: verify your wallet>"
    );

    expect(unfurl_links).toBe(false);
    expect(unfurl_media).toBe(false);
  });

  it("preserves the bot's own <url|post> link", async () => {
    const { slackClient, posted } = mockSlackClient();
    const message = discordMessage({
      channelId: DISCORD_DEVELOPER_HELP,
      content: "how do I sign a transaction?",
      url: "https://discord.com/channels/1/2/3",
    });

    await developerHelpWatchMessages(
      message,
      mockDiscordClient(guildTextChannel("developer-help")),
      slackClient,
      mockLogger()
    );

    expect(posted[0].text).toBe(
      "*developer-help*, from *mallory*, <https://discord.com/channels/1/2/3|post>:\nhow do I sign a transaction?"
    );
  });
});
