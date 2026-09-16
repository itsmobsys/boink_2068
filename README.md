# boink

A personal site built on top of a live Discord profile — who I am, how I work, what I keep building, and what I'm into right now.

Next.js (App Router) server-renders everything. Discord identity (avatar, name, badges, account age) resolves live on the server via an owner-only OAuth flow, live presence arrives through a separate Gateway bridge, and all curated copy lives in one file. Visitors never log in. Secrets never reach the browser.

## How it works

```text
Discord API ──OAuth (identify)──▶ lib/discord.js ──┐
                                                    ├─▶ lib/profile.js ─▶ app/page.js ─▶ components
Discord Gateway ──bridge──▶ lib/discord-presence.js ┘
```

Three data categories (see `lib/profile.js`):

1. **Discord-owned (live):** id, username, global name, avatar, banner, accent color, account age, badge count. Never hardcoded, never exposed tokens.
2. **Site-owned (curated):** personal line, skills, about, vibe, habits, currently, final. Edit `lib/profile.js` to update the site.
3. **UI state:** computed in components, never stored.

Key behaviors:

- **ISR:** homepage revalidates every 60s so the presence dot stays fresh without per-visitor Discord traffic.
- **Independent failure:** OAuth identity and Gateway presence fail independently — a revoked token never kills the status dot, a dead bridge never kills the avatar. The site always renders, falling back to truthful local values.
- **Server-only boundary:** `lib/discord.js` uses `import "server-only"` — importing it from a client component is a build error.
- **Token rotation persistence:** Discord rotates refresh tokens on most grants. Rotations are persisted to Upstash Redis (`lib/discord-token-store.mjs`), so cold starts and sibling instances never exchange a dead token.

## Tech stack

- Next.js 16 (App Router), React 19
- `motion` for reveals, `next/font` for self-hosted fonts
- `@upstash/redis` for the persistent refresh-token store
- `server-only` to enforce the server boundary
- Plain Node.js service (`discord-presence-bridge/`, `discord.js` Gateway) for live presence

## Project structure

```text
app/
  page.js                    # server component: getProfile() → adapt → render
  layout.js                  # fonts, metadata, viewport
  api/auth/discord/          # owner-only OAuth start + callback routes
  setup/discord/             # unlinked owner setup page (authorize once)
components/discord-identity/ # Hero, About, Vibe, ThingsIDo, Currently, Final, …
lib/
  profile.js                 # single source of truth (composition + site copy)
  discord.js                 # server-only Discord boundary
  discord-refresh.mjs        # pure OAuth client (token exchange, caching, dedup)
  discord-token-store.mjs    # Redis-backed refresh-token store (+ env seed)
  discord-presence.js/.mjs   # bridge reader, labels, 60s cache
  discord-utils.mjs          # snowflake year, avatar URL, accent picking
  discord-identity/          # adapter: profile → UI data shape
discord-presence-bridge/     # Gateway → HTTP bridge (own README, own deploy)
```

## Getting started

```sh
npm install
cp .env.example .env   # fill values (below), never commit
npm run dev            # http://localhost:3000
```

```sh
npm run build
npm start
npm test               # node --test lib/*.test.mjs (no Discord calls)
```

Requires Node 20+.

## Environment variables

All server-only. Never prefix with `NEXT_PUBLIC_`. See `.env.example` for the full annotated reference.

| Variable | Purpose |
|---|---|
| `DISCORD_CLIENT_ID` | Discord application client ID |
| `DISCORD_CLIENT_SECRET` | OAuth client secret |
| `DISCORD_REDIRECT_URI` | Must exactly match a redirect URL in the Discord portal (local: `http://localhost:3000/api/auth/discord/callback`) |
| `DISCORD_REFRESH_TOKEN` | Initial seed only (pre-store deployments). Ignored once the store is seeded |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Persistent token store (provisioned by attaching Upstash Redis) |
| `DISCORD_USER_ID` | Owner account ID (`920627516694200360`) |
| `DISCORD_PRESENCE_BRIDGE_URL` | Bridge URL, e.g. `https://boink-presence.up.railway.app` |
| `DISCORD_PRESENCE_BRIDGE_SECRET` | Must match the bridge's `PRESENCE_SHARED_SECRET`. Unset either bridge var and presence honestly shows UNAVAILABLE |

## Discord setup (one time, owner only)

1. [Discord Developer Portal](https://discord.com/developers) → New Application → OAuth2.
2. Add a redirect URL exactly matching `DISCORD_REDIRECT_URI`.
3. Set the static vars, attach an Upstash Redis database so `UPSTASH_*` is provisioned, redeploy.
4. Open `/setup/discord` (unlinked route), authorize (`identify` scope only). The refresh token stores itself — no copying, no second redeploy.
5. If Discord ever rejects the stored token (revoked), the site keeps rendering from cache and `/setup/discord` says so — authorize once more to reseed.

## Live presence bridge

Live status (online/idle/dnd/offline) comes from `discord-presence-bridge/` — a tiny persistent service watching one user over the Gateway and serving one authenticated JSON endpoint. Full docs in [`discord-presence-bridge/README.md`](discord-presence-bridge/README.md).

```sh
Discord Gateway → bridge → GET /presence → website → Hero dot
```

The website reads it server-side with a 60s cache + dedup.

## Deployment

- **Website:** Vercel (or any Next.js host). Set server env vars, attach Upstash Redis, deploy, then visit `/setup/discord` once.
- **Bridge:** Railway or Render (persistent process — not Vercel). `render.yaml` at the repo root is a Blueprint for the bridge only (`npm install` → `npm start`, health check at `/health`). There is intentionally no `npm run build` for the bridge. See the bridge README §7–§8 for Render specifics and free-tier keep-warm notes.

## Editing the site

All curated copy lives in `lib/profile.js` (`site` object): personal line, skill chips, About, Vibe (`personality.json` source), habits, Currently snapshot, final thoughts. Discord-owned fields update themselves.

## Security model

- `identify` scope only. Access tokens are short-lived, never stored, logged, or sent to the browser.
- Refresh token lives in Redis; only labels/booleans (never values) surface in `/setup/discord` diagnostics.
- Bridge auth is a shared secret over `Authorization: Bearer`; logs contain lifecycle lines only.
