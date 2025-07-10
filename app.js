require('dotenv').config();
const { App } = require("@slack/bolt");

process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
    process.exit(1);
});


// #channel-watch
const NOTIFY_CHANNEL_ID = "C3M36JMUN";

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
});

app.receiver.client.on('error', (error) => {
    console.error('SOCKET MODE CLIENT ERROR:', error);
    process.exit(1);
});


const channelCache = new Map();

const getChannleList = async (client, logger) => {
    try {
        let cursor;
        do {
            const result = await app.client.conversations.list({ limit: 1000, cursor });
            result.channels.forEach(channel => {
                channelCache.set(channel.id, channel.name);
            });
            cursor = result.response_metadata?.next_cursor;
        } while (cursor);
    } catch (error) {
        logger.error(error);
    }
};

const postNotification = async (
    client,
    emoji,
    action,
    chid,
    chname,
    logger,
    isDeleted = false,
    oldName = null
) => {
    try {
        let messageText;
        if (isDeleted) {
            messageText = `${emoji} ${action}: #${chname}`;
        } else if (oldName) {
            messageText = `${emoji} ${action}: <#${chid}|${chname}> (#${oldName} → #${chname})`;
        } else {
            messageText = `${emoji} ${action}: <#${chid}|${chname}>`;
        }

        await client.chat.postMessage({
            channel: NOTIFY_CHANNEL_ID,
            text: messageText,
        });
        logger.info(`Posted notification: ${messageText}`);
    } catch (error) {
        logger.error(error);
    }
};

app.view("modal-id", async ({ ack, view, logger }) => {
    logger.info(`Submitted data: ${view.state.values}`);
    await ack();
});

app.event("channel_archive", async ({ event, client, logger }) => {
    try {
        const { channel: chid } = event;
        const result = await app.client.conversations.info({ channel: chid });
        await postNotification(
            client,
            ":ghost:",
            "Archived",
            chid,
            result.channel.name,
            logger
        );
    } catch (error) {
        logger.error(error);
    }
});

app.event("channel_unarchive", async ({ event, client, logger }) => {
    try {
        const { channel: chid } = event;
        const result = await app.client.conversations.info({ channel: chid });
        await postNotification(
            client,
            ":sushi:",
            "Unarchived",
            chid,
            result.channel.name,
            logger
        );
    } catch (error) {
        logger.error(error);
    }
});

app.event("channel_created", async ({ event, client, logger }) => {
    try {
        const { id: chid, name: chname } = event.channel;
        channelCache.set(chid, chname);
        await postNotification(
            client,
            ":hatching_chick:",
            "Created",
            chid,
            chname,
            logger
        );
    } catch (error) {
        logger.error(error);
    }
});

app.event("channel_rename", async ({ event, client, logger }) => {
    try {
        const { id: chid, name: chname } = event.channel;
        const oldName = channelCache.get(chid) || "Unknown";
        channelCache.set(chid, chname);
        await postNotification(
            client,
            ":ocean:",
            "Renamed",
            chid,
            chname,
            logger,
            false,
            oldName
        );
    } catch (error) {
        logger.error(error);
    }
});

app.event("channel_deleted", async ({ event, client, logger }) => {
    try {
        const { channel: chid } = event;
        const chname = channelCache.get(chid) || "Unknown";
        await postNotification(
            client,
            ":fire:",
            "Deleted",
            chid,
            chname,
            logger,
            true
        );
    } catch (error) {
        logger.error(error);
    }
});

(async () => {
    await getChannleList(app.client, app.logger);
    await app.start();
    console.log("⚡️ Bolt app started");
})();
