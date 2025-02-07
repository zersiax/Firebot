"use strict";

const twitchChat = require("../../chat/twitch-chat");
const logger = require("../../logwrapper");
const accountAccess = require("../account-access");
const discordEmbedBuilder = require("../../integrations/builtin/discord/discord-embed-builder");
const discord = require("../../integrations/builtin/discord/discord-message-sender");
const utils = require("../../utility");

const twitchApi = require("../../twitch-api/api");
const client = twitchApi.getClient();

/**
 * @returns {Promise<HelixClip?>}
 */
exports.createClip = async function(effect) {

    const streamerAccount = accountAccess.getAccounts().streamer;
    const broadcast = await client.streams.getStreamByUserName(streamerAccount.username);
    const channelId = (await client.users.getUserByName(streamerAccount.username)).id;

    if (broadcast == null) {
        renderWindow.webContents.send('error', `Failed to create a clip. Reason: Streamer is not live.`);
        return null;
    }

    if (effect.postLink) {
        twitchChat.sendChatMessage("Creating clip...");
    }

    let clipId;

    try {
        clipId = await client.clips.createClip({
            channelId: channelId
        });
    } catch (err) {
        //failed to create clip
    }

    if (clipId == null) {
        if (effect.postLink) {
            twitchChat.sendChatMessage("Whoops! Something went wrong when creating a clip. :(");
        }
        return null;
    }

    /**@type {import('@twurple/api').HelixClip} */
    let clip;
    let attempts = 0;
    do {
        attempts++;
        try {
            clip = await client.clips.getClipById(clipId);
        } catch (err) {
            //failed to get clip
        }
        if (clip == null) {
            await utils.wait(1000);
        }
    }
    while (clip == null && attempts < 15);

    if (clip != null) {
        if (effect.postLink) {
            const message = `Clip created: ${clip.url}`;
            twitchChat.sendChatMessage(message);
        }

        if (effect.postInDiscord) {
            const clipEmbed = await discordEmbedBuilder.buildClipEmbed(clip);
            discord.sendDiscordMessage(effect.discordChannelId, "A new clip was created!", clipEmbed);
        }

        logger.info("Successfully created a clip!");
    } else {
        if (effect.postLink) {
            twitchChat.sendChatMessage("Whoops! Something went wrong when creating a clip. :(");
        }
    }
    return clip;
};