<p align="center">
  <img src="https://api.iconify.design/lucide:gauge.svg?color=%238b5cf6&width=80&height=80" alt="AC Web" />
</p>

<h1 align="center">AC Web</h1>

<p align="center">
  <strong>Full-stack web control panel for Assetto Corsa community servers.</strong><br/>
  Upload cars &amp; tracks, switch configs, manage players — Content Manager auto-download built in.<br/>
  Dynamic public landing page that adapts to whatever is running on the server.
</p>

<p align="center">
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt-4-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white" /></a>
  <a href="https://ui.nuxt.com"><img src="https://img.shields.io/badge/Nuxt_UI-v4-8b5cf6?style=for-the-badge&logo=nuxt.js&logoColor=white" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" /></a>
  <a href="https://github.com/compujuckel/AssettoServer"><img src="https://img.shields.io/badge/AssettoServer-latest-EF4444?style=for-the-badge" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" /></a>
</p>

<p align="center">
  <a href="https://ac.karel.app"><strong>Live Demo &rarr; ac.karel.app</strong></a>
</p>

---

## Why AC Web?

Running an AC server usually means editing INI files over SSH, restarting Docker containers, and telling players to "download this zip from Discord." **AC Web kills all of that.**

- **Upload a car zip** → it's instantly available for Content Manager auto-download
- **Switch tracks** → `content.json` regenerates, server restarts, landing page updates
- **Apply a template** → entire server preset swaps in one click
- **Players click Join** → Content Manager downloads everything, they're driving in seconds

No config files. No SSH. No "download this mod pack." Everything from your browser.

---

## Features

### Content Manager Auto-Download

> Players click **Connect** and Content Manager downloads everything automatically. No manual installs, no Discord links, no "download this mod pack" messages.

- **Upload a car `.zip`** via the admin panel — it's instantly available for CM download
- **Upload a track `.zip`** — same thing, zero config
- **Switch cars or tracks** — `content.json` regenerates automatically
- **Apply a template** — entire server preset swaps in one click, CM links update immediately
- Content served via nginx with `sendfile` optimization for fast downloads
- Works with any mod content — VDC packs, custom cars, community tracks, anything

### Server Templates

One-click server presets that change **everything** — track, cars, server name, assists, and CM download links.

```
Template: "Rally Touge"
  Track:  Goodwood Festival of Speed (layout_a)
  Cars:   7 rally/hillclimb cars (14 slots)
  ABS:    On  |  TC: On
  → Click "Apply" → Server restarts with new config + CM links
```

Create unlimited templates. Switch between drift nights, rally events, track days — instantly.

### Car & Track Management

- **Upload** — drag & drop `.zip` or `.tar.gz` archives
- **Toggle** — enable/disable cars from your installed content library
- **Auto-skin** — entry list populated with first available skin per car
- **Live preview** — see what's active before restarting

### Server Configuration

Full control over `server_cfg.ini` without touching files:

| Setting | Control |
|---------|---------|
| Server name & description | BBCode editor with live preview |
| Password & lobby registration | Toggle on/off |
| Assists | ABS, TC, stability, autoclutch |
| Simulation | Damage, fuel rate, tyre wear |
| Track grip | Session start, randomness, lap gain |
| Weather | 18 presets + temperature + wind |
| WeatherFX | Time of day, date/season, time multiplier |
| Plugins | Enable/disable AssettoServer plugins |

### Player Management

- **Online players** — see who's connected in real-time
- **Kick & ban** — one click, instant effect
- **Whitelist** — restrict server access by Steam GUID
- **Blacklist** — permanent bans
- **Admin list** — grant in-game admin privileges

### Live Monitoring

- **Auto-refresh** dashboard — player count, session, track info
- **Server logs** — real-time streaming via SSE
- **Server status** — online/offline with uptime tracking

### Dynamic Landing Page

A fully dynamic public page that **automatically reflects whatever is running on the server** — no hardcoded content, no manual updates.

- **Track preview hero** — full-bleed background image from the active track
- **Server theme headline** — parsed from server name, bold editorial typography
- **Car grid with preview images** — built dynamically from active car list
- **Live player count** — real-time with 10s auto-refresh
- **One-click "Join Server"** — Content Manager connect link
- **Dynamic `<title>` tag** — browser tab shows current server theme
- Change the server to a different track/car pack → landing page updates automatically

### Internationalization

- Built-in Czech/English toggle
- All admin UI labels translatable via JSON locale files
- SSR-safe implementation with `useState`

---

## Architecture

```
Browser ──→ Nginx ──→ Nuxt (port 3030)     → Admin panel + API
                  ──→ AssettoServer (8081)  → Game API (/INFO, /JSON)
                  ──→ /downloads/*.zip      → CM content (sendfile)

Admin API writes:
  ├── server_cfg.ini    (server config)
  ├── entry_list.ini    (car slots)
  ├── extra_cfg.yml     (AssettoServer extended config)
  ├── content.json      (CM auto-download manifest)
  ├── content/cars/     (extracted car data)
  ├── content/tracks/   (extracted track data)
  └── downloads/*.zip   (served to CM clients)
```

**Content Manager download flow:**

1. CM client connects → calls `GET /api/details`
2. AssettoServer returns `content.json` with download URLs
3. CM downloads missing `.zip` files from `/downloads/`
4. Player joins — no manual installs needed

**`content.json` is regenerated automatically** whenever you:
- Change active cars (`/admin/cars`)
- Change active track (`/admin/track`)
- Apply a template (`/admin/templates`)
- Edit raw server config (`/admin/server`)
- Upload new content (`/admin/content`)

---

## Self-Hosting

### Prerequisites

- [AssettoServer](https://github.com/compujuckel/AssettoServer) (Docker or standalone)
- Node.js 20+
- nginx (recommended)

### Quick Start

```bash
git clone https://github.com/iamLukyy/ac-web.git
cd ac-web
npm install
cp .env.example .env   # edit with your paths
npm run build
PORT=3030 pm2 start .output/server/index.mjs --name ac-web
```

### Environment Variables

```env
NUXT_ADMIN_PASSWORD=your-password        # Admin panel login
NUXT_SESSION_SECRET=random-secret        # Session encryption key
NUXT_DATA_PATH=/path/to/server/data      # AssettoServer data directory
NUXT_DOCKER_COMPOSE_PATH=/path/to/server # Directory with docker-compose.yml
NUXT_AC_SERVER_URL=http://127.0.0.1:8081 # AssettoServer HTTP API
```

### Nginx Config

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # AC server API (Content Manager needs direct access)
    location /INFO { proxy_pass http://127.0.0.1:8081; }
    location /JSON { proxy_pass http://127.0.0.1:8081; }
    location ~ ^.*/api/ { proxy_pass http://127.0.0.1:8081; }

    # CM content downloads (fast sendfile)
    location /downloads/ {
        alias /path/to/downloads/;
        sendfile on;
        tcp_nopush on;
    }

    # Nuxt app
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

### Development

```bash
npm install
npm run dev    # http://localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 4](https://nuxt.com) |
| UI Components | [@nuxt/ui v4](https://ui.nuxt.com) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Server Engine | [Nitro](https://nitro.build) |
| Game Server | [AssettoServer](https://github.com/compujuckel/AssettoServer) |
| Process Manager | [PM2](https://pm2.keymetrics.io) |
| Reverse Proxy | [nginx](https://nginx.org) |

---

## License

[MIT](LICENSE)

AC Web is an independent project. It communicates with [AssettoServer](https://github.com/compujuckel/AssettoServer) (AGPL-3.0) via HTTP API and config files — it does not modify, link against, or redistribute any AssettoServer code.
