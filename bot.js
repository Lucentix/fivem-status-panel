require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN;
const FIVEM_SERVER_IP = process.env.FIVEM_SERVER_IP;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ADMIN_CHANNEL_ID = process.env.ADMIN_CHANNEL_ID;
const UPDATE_INTERVAL = 1 * 60 * 1000;
const MESSAGE_ID_FILE = './messageId.json';
const STATUS_FILE = './status.json';
const SHOW_PLAYER_LIST = process.env.SHOW_PLAYER_LIST === 'true';
const PLAYER_MESSAGE_IDS_FILE = './playerMessageIds.json';
const PLAYER_HISTORY_FILE = './playerHistory.json';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let messageId = null;
let lastStatus = null;
let playerMessageIds = [];
let maintenanceMode = false;

if (fs.existsSync(MESSAGE_ID_FILE)) {
    const data = fs.readFileSync(MESSAGE_ID_FILE, 'utf8');
    messageId = JSON.parse(data).messageId || null;
}

if (fs.existsSync(STATUS_FILE)) {
    const data = fs.readFileSync(STATUS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    lastStatus = parsed.lastStatus || null;
}

if (fs.existsSync(PLAYER_MESSAGE_IDS_FILE)) {
    const data = fs.readFileSync(PLAYER_MESSAGE_IDS_FILE, 'utf8');
    playerMessageIds = JSON.parse(data).playerMessageIds || [];
}

let playerHistory = {};
if (fs.existsSync(PLAYER_HISTORY_FILE)) {
    const data = fs.readFileSync(PLAYER_HISTORY_FILE, 'utf8');
    playerHistory = JSON.parse(data);
}

async function fetchServerStatus() {
    const startTime = Date.now();
    try {
        const response = await axios.get(`http://${FIVEM_SERVER_IP}:30120/info.json`);
        const playersResponse = await axios.get(`http://${FIVEM_SERVER_IP}:30120/players.json`);
        const ping = Date.now() - startTime;

        const serverName = response.data.vars.sv_projectName || 'Unknown';
        const playerCount = playersResponse.data.length || 0;
        const maxPlayers = response.data.vars.sv_maxClients || 'Unknown';
        const tags = response.data.vars.tags || 'None';
        const resources = response.data.resources ? response.data.resources.length : 0;
        const projectDescription = response.data.vars.sv_projectDesc || 'No description';
        const serverVersion = response.data.server || 'Unknown';

        const players = playersResponse.data.map(player => ({
            label: player.name,
            description: `Ping: ${player.ping}ms`,
            value: player.name
        }));

        return {
            name: serverName,
            status: 'Online',
            players: `${playerCount}/${maxPlayers}`,
            playerList: players,
            tags,
            resources: resources.toString(),
            projectDescription,
            serverVersion,
            ping: `${ping}ms`,
        };
    } catch (error) {
        return {
            name: 'Unknown',
            status: 'Offline',
            players: '0/0',
            playerList: [],
            tags: 'N/A',
            resources: 'N/A',
            projectDescription: 'N/A',
            serverVersion: 'N/A',
            ping: 'N/A',
        };
    }
}

async function updateStatus() {
    const status = await fetchServerStatus();
    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setTitle('FiveM Server Status')
        .addFields(
            { name: 'Server Name', value: status.name || 'Unknown', inline: true },
            { name: 'Status', value: status.status || 'Unknown', inline: true },
            { name: 'Players', value: status.players || '0/0', inline: true },
            { name: 'Tags', value: status.tags || 'None', inline: true },
            { name: 'Resources', value: status.resources || 'N/A', inline: true },
            { name: 'Ping', value: status.ping || 'N/A', inline: true },
            { name: 'Description', value: status.projectDescription || 'No description', inline: false },
            { name: 'Server Version', value: status.serverVersion || 'Unknown', inline: true }
        )
        .setColor(status.status === 'Online' ? 'Green' : 'Red')
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Refresh Status')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('refresh_status'),
        new ButtonBuilder()
            .setLabel('Top 5 Players')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('top_players')
    );

    try {
        if (messageId) {
            const message = await channel.messages.fetch(messageId);
            await message.edit({ embeds: [embed], components: [row] });
        } else {
            const message = await channel.send({ embeds: [embed], components: [row] });
            messageId = message.id;

            // Save the message ID to the file
            fs.writeFileSync(MESSAGE_ID_FILE, JSON.stringify({ messageId }));
        }
    } catch (error) {
        console.error('Error updating message:', error);

        // If the message ID is invalid, reset it and send a new message
        const message = await channel.send({ embeds: [embed], components: [row] });
        messageId = message.id;
        fs.writeFileSync(MESSAGE_ID_FILE, JSON.stringify({ messageId }));
    }

    if (status.status === 'Online') {
        await updatePlayerHistory(status.playerList);
    }

    // Handle player list embeds
    if (SHOW_PLAYER_LIST) {
        const playerEmbeds = [];
        if (status.playerList.length > 0) {
            for (let i = 0; i < status.playerList.length; i += 30) {
                const chunk = status.playerList.slice(i, i + 30);
                const playerEmbed = new EmbedBuilder()
                    .setTitle(`Player List (${i + 1}-${Math.min(i + 30, status.playerList.length)})`)
                    .setDescription(chunk.map(player => `${player.label} - ${player.description}`).join('\n'))
                    .setColor('Blue')
                    .setTimestamp();
                playerEmbeds.push(playerEmbed);
            }
        } else {
            const noPlayersEmbed = new EmbedBuilder()
                .setTitle('Player List')
                .setDescription('No one is online right now')
                .setColor('Blue')
                .setTimestamp();
            playerEmbeds.push(noPlayersEmbed);
        }

        // Update or send player list embeds
        for (let i = 0; i < playerEmbeds.length; i++) {
            if (playerMessageIds[i]) {
                try {
                    const message = await channel.messages.fetch(playerMessageIds[i]);
                    await message.edit({ embeds: [playerEmbeds[i]] });
                } catch (error) {
                    console.error('Error updating player list message:', error);
                    const message = await channel.send({ embeds: [playerEmbeds[i]] });
                    playerMessageIds[i] = message.id;
                }
            } else {
                const message = await channel.send({ embeds: [playerEmbeds[i]] });
                playerMessageIds[i] = message.id;
            }
        }

        // Remove extra player list messages if the number of embeds decreases
        while (playerMessageIds.length > playerEmbeds.length) {
            const messageIdToDelete = playerMessageIds.pop();
            try {
                const message = await channel.messages.fetch(messageIdToDelete);
                await message.delete();
            } catch (error) {
                console.error('Error deleting extra player list message:', error);
            }
        }

        // Save the player list message IDs to the file
        fs.writeFileSync(PLAYER_MESSAGE_IDS_FILE, JSON.stringify({ playerMessageIds }));
    }

    // Handle status change notifications
    if (lastStatus !== status.status) {
        const adminChannel = await client.channels.fetch(ADMIN_CHANNEL_ID);
        const now = Date.now();

        if (lastStatus === 'Offline' && status.status === 'Online') {
            const downtime = now - (fs.existsSync(STATUS_FILE) ? JSON.parse(fs.readFileSync(STATUS_FILE)).lastChange : now);
            await adminChannel.send(`The server is back online! Downtime: ${Math.floor(downtime / 1000)} seconds.`);
        } else if (lastStatus === 'Online' && status.status === 'Offline') {
            await adminChannel.send('The server is now offline!');
        }

        // Save the new status and timestamp
        lastStatus = status.status;
        fs.writeFileSync(STATUS_FILE, JSON.stringify({ lastStatus, lastChange: now }));
    }

    console.log(`Updated status: ${status.name} - ${status.status} - ${status.players}`);
}

async function updatePlayerHistory(players) {
    const now = Date.now();
    players.forEach(player => {
        if (!playerHistory[player.label]) {
            playerHistory[player.label] = { totalOnlineTime: 0, lastSeen: now };
        }
        const playerData = playerHistory[player.label];
        if (playerData.lastSeen) {
            playerData.totalOnlineTime += now - playerData.lastSeen;
        }
        playerData.lastSeen = now; // Update last seen time
    });
    fs.writeFileSync(PLAYER_HISTORY_FILE, JSON.stringify(playerHistory));
}

function getTopPlayers(limit = 5) {
    const sortedPlayers = Object.entries(playerHistory)
        .sort(([, a], [, b]) => b.totalOnlineTime - a.totalOnlineTime)
        .slice(0, limit)
        .map(([name, data], index) => `${index + 1}. ${name} - ${Math.floor(data.totalOnlineTime / 60000)} minutes`);
    return sortedPlayers.length > 0 ? sortedPlayers.join('\n') : 'No players have been tracked yet.';
}

const REFRESH_COOLDOWN = 30 * 1000; // 30 seconds cooldown
let lastRefreshTime = 0; // Track the last time the refresh button was used

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    const { commandName, customId, options } = interaction;

    if (commandName === 'status') {
        const status = await fetchServerStatus();
        const embed = new EmbedBuilder()
            .setTitle('FiveM Server Status')
            .addFields(
                { name: 'Server Name', value: status.name || 'Unknown', inline: true },
                { name: 'Status', value: status.status || 'Unknown', inline: true },
                { name: 'Players', value: status.players || '0/0', inline: true },
                { name: 'Tags', value: status.tags || 'None', inline: true },
                { name: 'Resources', value: status.resources || 'N/A', inline: true },
                { name: 'Ping', value: status.ping || 'N/A', inline: true },
                { name: 'Description', value: status.projectDescription || 'No description', inline: false },
                { name: 'Server Version', value: status.serverVersion || 'Unknown', inline: true }
            )
            .setColor(status.status === 'Online' ? 'Green' : 'Red')
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === 'players') {
        const status = await fetchServerStatus();
        if (status.playerList.length > 0) {
            const playerDescriptions = status.playerList.map(player => `${player.label} - ${player.description}`).join('\n');
            await interaction.reply({ content: `**Players Online:**\n${playerDescriptions}`, ephemeral: true });
        } else {
            await interaction.reply({ content: 'No one is online right now.', ephemeral: true });
        }
    }

    if (commandName === 'lastseen') {
        const playerName = options.getString('player');
        const playerData = playerHistory[playerName];
        if (playerData && playerData.lastSeen) {
            const lastSeenDate = new Date(playerData.lastSeen).toLocaleString(); // Convert timestamp to a readable date
            await interaction.reply({ content: `${playerName} was last seen online at ${lastSeenDate}.`, ephemeral: true });
        } else {
            await interaction.reply({ content: `${playerName} has not been seen online.`, ephemeral: true });
        }
    }

    if (customId === 'refresh_status') {
        const now = Date.now();
        if (now - lastRefreshTime < REFRESH_COOLDOWN) {
            const remainingTime = Math.ceil((REFRESH_COOLDOWN - (now - lastRefreshTime)) / 1000);
            await interaction.reply({
                content: `You can refresh the status again in ${remainingTime} seconds.`,
                ephemeral: true,
            });
            return;
        }

        lastRefreshTime = now; // Update the last refresh time
        await interaction.deferReply({ ephemeral: true });
        await updateStatus();
        await interaction.editReply({ content: 'Status refreshed!', ephemeral: true });
    }

    if (customId === 'top_players') {
        const topPlayers = getTopPlayers();
        await interaction.reply({ content: `**Top 5 Active Players:**\n${topPlayers}`, ephemeral: true });
    }
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    const commands = [
        {
            name: 'status',
            description: 'Shows the current server status',
        },
        {
            name: 'players',
            description: 'Shows a list of players with ping and Steam IDs (if available)',
        },
        {
            name: 'lastseen',
            description: 'Shows the last connection time of a player',
            options: [
                {
                    name: 'player',
                    type: 3, // STRING
                    description: 'The name of the player',
                    required: true,
                },
            ],
        },
    ];

    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash commands registered.');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }

    updateStatus();
    setInterval(updateStatus, UPDATE_INTERVAL);
});

client.login(BOT_TOKEN);