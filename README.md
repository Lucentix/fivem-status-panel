# FiveM Status Bot

A Discord bot to monitor the status of a FiveM server, display player statistics, and provide useful commands.

## Features

- Displays server status (online/offline, player count, etc.).
- Tracks player activity and shows a leaderboard of the most active players.
- Provides commands to view server status, player list, and last seen information.
- Includes buttons for refreshing the status and viewing the top 5 players.

## Installation

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in the required values.
4. Start the bot:
   ```bash
   node bot.js
   ```

## Commands

- `/status`: Shows the current server status.
- `/players`: Displays a list of online players with their ping.
- `/lastseen <player>`: Shows the last time a player was online.

## Buttons

- **Refresh Status**: Updates the server status immediately.
- **Top 5 Players**: Displays the top 5 most active players.

## Environment Variables

See `.env.example` for required environment variables.