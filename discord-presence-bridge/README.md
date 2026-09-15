# discord-presence-bridge

Tiny persistent service that watches **one** Discord user's presence over the Gateway and serves it as one tiny authenticated JSON endpoint for the Boink website.

```text
Discord Gateway → bridge → GET /presence → Vercel website → Hero
```

No database. No Redis. No frontend. No polling of Discord — the Gateway pushes, the bridge remembers, the website reads with its own short cache.

## 1. Create the Discord application / bot

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Go to **Bot** → **Reset Token** → copy the token → this is `DISCORD_BOT_TOKEN` (never share it, never commit it).
3. On the same Bot page, under **Privileged Gateway Intents**, enable **Presence Intent**. Nothing else needs enabling — specifically, do NOT enable Message Content, Server Members, or any other privileged intent.
4. Go to **OAuth2 → URL Generator**, tick the `bot` scope, leave permissions at `0` (plain membership is all it needs), open the generated URL and invite the bot to a server where **both the bot and the owner account are members**. No admin permissions required.

## 2. Find the guild ID

In Discord: Server Settings → Widget → **Server ID** (you do not need to enable the widget itself). Or enable Developer Mode → right-click the server → Copy Server ID. This is `DISCORD_GUILD_ID`.

## 3. Configure Railway

1. Push this repository to GitHub (values are never committed — only `.env.example` ships).
2. Railway → New Project → Deploy from GitHub → select the repo.
3. Set the service **Root Directory** to `discord-presence-bridge` (the bridge lives in a monorepo subdirectory).
4. Railway → service → **Variables**, add:
   - `DISCORD_BOT_TOKEN` — from step 1
   - `DISCORD_USER_ID` — `920627516694200360` (default already matches; set explicitly anyway)
   - `DISCORD_GUILD_ID` — from step 2
   - `PRESENCE_SHARED_SECRET` — minimum 32 chars, e.g. `openssl rand -hex 32`
   - `PORT` is injected by Railway automatically; do not set it.
5. Deploy. Railway restarts the service on crashes and redeploys.

## 4. Configure the website (Vercel)

1. Copy the Railway service's public domain, e.g. `https://boink-presence.up.railway.app`.
2. Vercel → project → Settings → Environment Variables (server-only, never `NEXT_PUBLIC_`):
   - `DISCORD_PRESENCE_BRIDGE_URL=https://boink-presence.up.railway.app`
   - `DISCORD_PRESENCE_BRIDGE_SECRET=` — exactly the same value as the bridge's `PRESENCE_SHARED_SECRET`.
3. Redeploy the website.

## 5. Test

```sh
# health (public, no auth)
curl https://<bridge>/health
# → {"ok":true,"service":"discord-presence-bridge"}

# presence without secret (must fail)
curl https://<bridge>/presence
# → {"error":"unauthorized"}

# presence with secret
curl -H "Authorization: Bearer <PRESENCE_SHARED_SECRET>" https://<bridge>/presence
# → {"status":"online","available":true,"source":"discord-gateway"}
```

Then change the owner account's Discord status (Online → Idle → Do Not Disturb → Offline) and re-run the last command: each state must appear within seconds. Stop the bridge (or revoke Gateway access) and confirm the response becomes `{"status":"unavailable","available":false,"source":"bridge"}` — never a stale `online`.

## 6. Run locally

```sh
cp .env.example .env   # fill values, never commit
npm install
npm start              # validates env, serves HTTP, connects Gateway
npm test               # pure + HTTP tests, no Discord connection needed
```

There is intentionally no `npm run build` — this is a plain Node.js
service, not a bundled app. `npm install` + `npm start` is the whole
pipeline.

## 7. Deploy on Render

This repo has no `npm run build` (plain Node service — see §6), so
Render must NOT be told to run one. Two equivalent options:

**A. Blueprint (recommended):** `render.yaml` at the repo root already
encodes everything below — Render → New → Blueprint → select the repo,
then fill the three prompted secrets.

**B. Manual service:** configure the dashboard service once:

- **Root Directory:** `discord-presence-bridge` (monorepo subdirectory)
- **Build Command:** `npm install` (NOT `npm run build` — no build script exists by design)
- **Start Command:** `npm start` (runs `node src/index.js`)
- **Health Check Path:** `/health`
- Environment → add `DISCORD_BOT_TOKEN`, `DISCORD_USER_ID`, `DISCORD_GUILD_ID`, `PRESENCE_SHARED_SECRET` (same values as §3 step 4; Render injects `PORT` itself and the server binds `0.0.0.0`).

## 8. Keep warm (external ping)

Render's free tier sleeps idle services. `GET /health` exists for
exactly this: point any external uptime/cron service at
`https://<bridge>/health` every few minutes.

- HTTP 200 + `{"ok":true,"service":"discord-presence-bridge"}` means the Node process is alive.
- No authentication, responds instantly, never touches the Discord Gateway.
- Returns nothing sensitive: no token, no secret, no user/guild IDs, no presence data.
- There is deliberately no internal `setInterval()` self-ping — keep-alive is the pinger's job, not the bridge's.

## Design notes

- Watches exactly one user ID; every other `PresenceUpdate` is ignored before anything is read, stored, or logged.
- State starts `unavailable` and returns to it on any disconnect, until a fresh trustworthy presence arrives. Seeding reads the member once on ready/resume; a fetched member with no presence is reported `offline` (that is what Discord means by absent presence data).
- Only `Guilds` + `GuildPresences` intents are requested.
- Logs contain lifecycle lines only — no tokens, secrets, headers, payloads, or other users.
- `SIGTERM`/`SIGINT` destroy the Discord client and close HTTP cleanly for Railway restarts.
