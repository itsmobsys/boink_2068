// Wiring only: env gate → HTTP → Gateway → signals. All decisions
// (normalize/auth/validate/state) live in presence.js; all HTTP in
// server.js. This file holds the secrets and never prints them.

import { Client, Events, GatewayIntentBits } from "discord.js";
import { createPresenceStore, validateEnv } from "./presence.js";
import { createServer } from "./server.js";

const TARGET_USER_ID = process.env.DISCORD_USER_ID || "920627516694200360";
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const PORT = Number(process.env.PORT || 3000);

const log = (message) => {
  // eslint-disable-next-line no-console
  console.log(message);
};

function shutdown(server, client, code) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    process.exit(code);
  };
  // Never hang a Railway restart on a stuck socket.
  setTimeout(finish, 5000).unref();
  log("[presence] shutting down");
  Promise.resolve()
    .then(() => client.destroy())
    .catch(() => {})
    .then(
      () =>
        new Promise((resolve) => {
          server.close(() => resolve());
        })
    )
    .then(finish, finish);
}

async function seedFromGuild(client, store, label) {
  // A successful member fetch WITH the presences intent is a
  // trustworthy moment: explicit presence wins, and a null presence
  // on a fetched member means Discord reports them as offline.
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(TARGET_USER_ID);
    store.setFromGateway(member.presence?.status ?? "offline");
    log(`[discord] seeded owner presence (${label})`);
  } catch {
    log("[discord] owner member fetch failed; staying unavailable until a live update arrives");
  }
}

async function main() {
  log("[presence] bridge starting");

  const problems = validateEnv(process.env);
  if (problems.length > 0) {
    for (const problem of problems) log(`[presence] config error: ${problem}`);
    process.exit(1);
  }

  const store = createPresenceStore();

  const server = createServer({
    getPresence: () => store.get(),
    secret: process.env.PRESENCE_SHARED_SECRET,
    logger: log,
  });
  await new Promise((resolve) => server.listen(PORT, "0.0.0.0", resolve));
  log("[presence] HTTP server listening");

  // Minimum viable intents: Guilds (guild/member access) +
  // GuildPresences (PRESENCE_UPDATE). Nothing else. In particular:
  // no MessageContent, no GuildMembers, no message intents.
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences],
  });

  client.once(Events.ClientReady, () => {
    log("[discord] gateway ready");
    void seedFromGuild(client, store, "ready");
  });

  client.on(Events.PresenceUpdate, (_oldPresence, newPresence) => {
    // The single most important line in this service: only the
    // configured owner can ever move the state. Everyone else is
    // ignored before anything is read, stored, or logged.
    if (!newPresence || newPresence.userId !== TARGET_USER_ID) return;
    store.setFromGateway(newPresence.status);
    log("[discord] presence update received for target user");
  });

  // Any loss of Gateway connectivity invalidates the state: a stale
  // "online" must never outlive the connection that reported it.
  client.on(Events.ShardDisconnect, () => {
    store.markUnavailable();
    log("[discord] gateway disconnected");
  });
  client.on(Events.ShardReconnecting, () => {
    store.markUnavailable();
    log("[discord] gateway reconnecting");
  });
  client.on(Events.ShardResume, () => {
    log("[discord] gateway resumed; re-seeding");
    void seedFromGuild(client, store, "resume");
  });
  client.on(Events.Error, () => {
    log("[discord] gateway error");
  });

  process.on("SIGTERM", () => shutdown(server, client, 0));
  process.on("SIGINT", () => shutdown(server, client, 0));

  log("[discord] connecting gateway");
  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch {
    // Invalid token / network failure at boot: say so without
    // leaking anything, and exit so the platform surfaces it.
    log("[discord] gateway login failed; check DISCORD_BOT_TOKEN and connectivity");
    shutdown(server, client, 1);
  }
}

main();
