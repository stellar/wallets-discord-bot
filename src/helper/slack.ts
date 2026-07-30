/**
 * Slack treats `&`, `<` and `>` as mrkdwn control characters. Any span of
 * untrusted text interpolated into a message must be entity-encoded first,
 * otherwise the author of that text controls the rendered markup.
 *
 * https://docs.slack.dev/messaging/formatting-message-text/
 *
 * `&` must be replaced first, or the ampersands introduced by the `<`/`>`
 * replacements get double-encoded.
 */
export const escapeSlackMrkdwn = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
