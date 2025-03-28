require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const FIVEM_SERVER_IP = process.env.FIVEM_SERVER_IP;
const PLAYER_HISTORY_FILE = '../playerHistory.json';

app.use(cors());

const rateLimit = {};
const RATE_LIMIT_WINDOW = 10 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 40; // Dont Edit this value, if you dont know what you are doing
const BLOCK_DURATION = 10 * 1000;

function rateLimitMiddleware(req, res, next) {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const currentTime = Date.now();

    if (!rateLimit[clientIp]) {
        rateLimit[clientIp] = { count: 1, lastRequest: currentTime, blockedUntil: null };
    } else {
        const clientData = rateLimit[clientIp];

        if (clientData.blockedUntil && currentTime < clientData.blockedUntil) {
            console.log(`[RateLimit] Blocked request from ${clientIp}`);
            return res.status(429).json({ error: 'Too many requests. You are blocked for 10 seconds.' });
        }

        const timeSinceLastRequest = currentTime - clientData.lastRequest;

        if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
            clientData.count++;
            if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
                clientData.blockedUntil = currentTime + BLOCK_DURATION;
                console.log(`[RateLimit] Blocking ${clientIp} for 10 seconds.`);
                return res.status(429).json({ error: 'Too many requests. You are blocked for 10 seconds.' });
            }
        } else {
            clientData.count = 1;
        }

        clientData.lastRequest = currentTime;
    }

    console.log(`[RateLimit] Request from ${clientIp}: ${rateLimit[clientIp].count} requests in the current window.`);
    next();
}

app.get('/status', rateLimitMiddleware, async (req, res) => {
    try {
        const startTime = Date.now();
        const infoResponse = await axios.get(`http://${FIVEM_SERVER_IP}:30120/info.json`);
        const playersResponse = await axios.get(`http://${FIVEM_SERVER_IP}:30120/players.json`);
        const ping = Date.now() - startTime;

        const serverStatus = {
            name: infoResponse.data.vars.sv_projectName || 'Unknown',
            status: 'Online',
            players: `${playersResponse.data.length}/${infoResponse.data.vars.sv_maxClients || 'Unknown'}`,
            tags: infoResponse.data.vars.tags || 'None',
            resources: infoResponse.data.resources ? infoResponse.data.resources.length : 'N/A',
            projectDescription: infoResponse.data.vars.sv_projectDesc || 'No description',
            serverVersion: infoResponse.data.server || 'Unknown',
            ping: `${ping}ms`,
        };

        res.json(serverStatus);
    } catch (error) {
        console.error('Error fetching server status:', error.message);
        res.json({
            name: 'Unknown',
            status: 'Offline',
            players: '0/0',
            tags: 'N/A',
            resources: 'N/A',
            projectDescription: 'N/A',
            serverVersion: 'N/A',
            ping: 'N/A',
        });
    }
});

app.get('/player-history', rateLimitMiddleware, (req, res) => {
    try {
        const playerHistory = fs.existsSync(PLAYER_HISTORY_FILE)
            ? JSON.parse(fs.readFileSync(PLAYER_HISTORY_FILE, 'utf8'))
            : {};

        const history = Object.entries(playerHistory).map(([name, data]) => ({
            name,
            lastSeen: new Date(data.lastSeen).toLocaleString(),
        }));

        const topPlayers = Object.entries(playerHistory)
            .sort(([, a], [, b]) => b.totalOnlineTime - a.totalOnlineTime)
            .slice(0, 5)
            .map(([name, data]) => `${name} - ${Math.floor(data.totalOnlineTime / 60000)} minutes`);

        res.json({ history, topPlayers });
    } catch (error) {
        console.error('Error fetching player history:', error.message);
        res.status(500).json({ error: 'Failed to fetch player history.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
