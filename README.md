# FiveM Status Panel

A complete solution to monitor the status of a FiveM server, including a Discord bot, a backend API, and a modern frontend.

## Features

- **Discord Bot**: Displays server status and player information in a Discord channel.
- **Backend API**: Provides server status and player history via RESTful endpoints.
- **Frontend**: A modern React-based web interface to display server status and player statistics.

---

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A FiveM server

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/fivem-status-panel.git
cd fivem-status-panel
```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your FiveM server IP and desired port.

5. Start the backend:
   ```bash
   npm start
   ```

The backend will run on `http://localhost:3001` by default.

---

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with the backend URL.

5. Start the frontend:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000` by default.

---

### 4. Discord Bot Setup

1. Navigate to the bot directory:
   ```bash
   cd ../
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Discord bot token, channel IDs, and FiveM server IP.

5. Start the bot:
   ```bash
   npm start
   ```

---

## Environment Variables

### Backend `.env`

```properties
FIVEM_SERVER_IP=YOUR_FIVEM_SERVER_IP
PORT=3001
```

### Frontend `.env`

```properties
REACT_APP_BACKEND_URL=http://localhost:3001
```

### Bot `.env`

```properties
BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
FIVEM_SERVER_IP=YOUR_FIVEM_SERVER_IP
CHANNEL_ID=YOUR_DISCORD_CHANNEL_ID
ADMIN_CHANNEL_ID=YOUR_ADMIN_CHANNEL_ID
SHOW_PLAYER_LIST=true
```

---

## .gitignore

Ensure sensitive files are ignored by Git. The `.gitignore` file includes:

```
# Node modules
node_modules/

# Environment files
.env
/backend/.env
/frontend/.env

# Build files
/frontend/build/

# Logs
*.log
```

---

## License

This project is licensed under the MIT License.