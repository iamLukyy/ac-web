<p align="center">
  <img src="https://api.iconify.design/lucide:gauge.svg?color=%238b5cf6&width=64&height=64" alt="AC Web logo" />
</p>

<h1 align="center">AC Web</h1>

<p align="center">
  Web control panel for <a href="https://github.com/compujuckel/AssettoServer">AssettoServer</a> — manage your Assetto Corsa server from the browser.
</p>

<p align="center">
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white" alt="Nuxt 4" /></a>
  <a href="https://ui.nuxt.com"><img src="https://img.shields.io/badge/%40nuxt%2Fui-v4-8b5cf6?logo=nuxt.js&logoColor=white" alt="Nuxt UI v4" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://github.com/iamLukyy/ac-web/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
</p>

---

## What is this?

A self-hostable web dashboard and admin panel for [AssettoServer](https://github.com/compujuckel/AssettoServer) (community Assetto Corsa multiplayer server). Built with Nuxt 4, designed for drift servers but works with any AC server setup.

**Live example:** [ac.karel.app](https://ac.karel.app)

## Features

### Public Dashboard
- Live server status (player count, session info, track, car list)
- Server connection info with Content Manager link
- Auto-refreshing every 10 seconds

### Admin Panel (`/admin`)
Password-protected control panel:

- **Server Settings** — name, description with BBCode editor & live preview, password, lobby registration, assists (ABS/TC/stability), damage/fuel/tyre rates
- **Track & Weather** — track and layout selector, 18 weather types, ambient/road temperature, wind speed & direction, track grip
- **WeatherFX** — time of day, date/season picker (controls sun position & day length), time speed multiplier (requires CSP)
- **Cars** — toggle active cars from installed content, upload new car archives
- **Plugins** — enable/disable AssettoServer plugins
- **Players** — online players with kick/ban, whitelist, blacklist, admin management
- **Live Logs** — real-time server log streaming via SSE

## Self-Hosting Guide

### Prerequisites

- [AssettoServer](https://github.com/compujuckel/AssettoServer) running (Docker or standalone)
- Node.js 20+
- nginx (recommended) or any reverse proxy

### 1. Clone & Install

```bash
git clone https://github.com/iamLukyy/ac-web.git
cd ac-web
npm install
```

### 2. Configure

Copy the example env file and edit it:

```bash
cp .env.example .env
```

```env
# Admin panel login password
NUXT_ADMIN_PASSWORD=your-secure-password

# Random string for session encryption
NUXT_SESSION_SECRET=generate-a-random-string-here

# Path to AssettoServer data directory (where cfg/, content/ live)
NUXT_DATA_PATH=/path/to/assettoserver/data

# Path to directory containing docker-compose.yml
NUXT_DOCKER_COMPOSE_PATH=/path/to/assettoserver

# AssettoServer HTTP API URL
NUXT_AC_SERVER_URL=http://127.0.0.1:8081
```

### 3. Build & Run

```bash
npm run build
PORT=3030 node .output/server/index.mjs
```

Or with PM2 for production:

```bash
npm run build
PORT=3030 pm2 start .output/server/index.mjs --name ac-web
```

### 4. Nginx (recommended)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL config...

    # Proxy AC server API endpoints
    location /INFO {
        proxy_pass http://127.0.0.1:8081;
    }
    location /JSON {
        proxy_pass http://127.0.0.1:8081;
    }
    location ~ ^.*/api/ {
        proxy_pass http://127.0.0.1:8081;
    }

    # Everything else → Nuxt app
    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development

```bash
npm install
npm run dev    # http://localhost:3000
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3) |
| UI | [@nuxt/ui v4](https://ui.nuxt.com) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Server | [Nitro](https://nitro.build) (built into Nuxt) |
| Game Server | [AssettoServer](https://github.com/compujuckel/AssettoServer) |

## License

[MIT](LICENSE)
