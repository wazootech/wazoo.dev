# Wazoo Stream privacy policy

> What the Wazoo Stream alerts tool reads from YouTube, where it keeps it, and how to remove it.

Source: https://wazoo.dev/stream-privacy/

Last updated: November 26, 2026.

Wazoo Stream is a small tool that Wazoo runs on its own streaming computer to show on-screen alerts during Wazoo's YouTube live streams. Its source code is public at [github.com/wazootech/stream](https://github.com/wazootech/stream). It is operated by the channel owner and is not offered as a service to others.

Wazoo Stream uses YouTube API Services. By using it you agree to the [YouTube Terms of Service](https://www.youtube.com/t/terms). Google's handling of data is described in the [Google Privacy Policy](https://policies.google.com/privacy).

## What it reads

The channel owner signs in with Google and grants read-only access to their YouTube account. The tool cannot post, edit, or delete anything. With that access it reads:

-   the name of the signed-in channel;
-   the channel's active live broadcast and its live chat messages;
-   from those messages, the details used for alerts: display names, Super Chat and Super Sticker amounts and text, membership levels, milestones and comments, and gifted membership counts;
-   the channel's recent subscribers who have made their subscriptions public, including their channel names and channel identifiers.

Chat messages that do not produce an alert are discarded.

## How it is used and shared

The information is used only to show alerts. An alert displays a name and its details on the live stream, so it also appears in recordings, archives, and clips of that stream. Wazoo Stream has no server of its own, runs no analytics or advertising, does not sell data, and sends nothing to anyone other than Google beyond what is shown on the stream.

## What is stored

-   Sign-in tokens, in a file in the operator's user folder on the streaming computer.
-   Up to the 20 most recent alerts (type, display name, and details), in local files on that computer. Clearing alerts or resetting the stream session removes them, and the operator does this at least every 30 days.
-   Message and subscriber identifiers, held in memory to avoid showing an alert twice, and gone when the tool stops.

The tool and its files use no cookies and no tracking technology.

## Removing access and data

Access can be revoked at any time on Google's [security settings page](https://security.google.com/settings/security/permissions). After access is revoked, the operator deletes the stored tokens and alerts within 30 days. To ask for an alert that shows your name to be removed from local storage, or from a published recording or clip, contact us. We remove it within 7 days of your request.

## Contact

Ask in the [Wazoo Discord](https://discord.gg/wpaavgRMAE) or open an issue at [github.com/wazootech/stream/issues](https://github.com/wazootech/stream/issues). GitHub issues are public, so leave out anything private.
