/* ═══════════════════════════════════════════════════════════════
   PROFILE — single source of truth for the hero (STEP 1)
   ───────────────────────────────────────────────────────────────
   Server-safe module: no window / document access here, so it can
   be imported from server components and (later) server routes.

   PLACEHOLDERS ONLY. Nothing below is presented as real Discord
   data — values stay neutral until the integration lands.

   WHEN DISCORD IS WIRED (later step):
     1. Resolve DISCORD_USER_ID via a server route / server action
        (never expose a bot token client-side — see .env.example).
     2. Return the Discord CDN avatar url, `global_name`, `username`,
        account age (from the snowflake) and badges from getProfile().
     3. Hero consumes the same shape — no rewrite needed.
   ═══════════════════════════════════════════════════════════════ */

export const DISCORD_USER_ID = "920627516694200360";

export const profile = {
  // Shown large under the avatar. Placeholder typography only.
  displayName: "Your Name",

  // Shown as @username. Keep generic until the API lands.
  username: "username",

  // ✎ EDIT ME — short personal line, understated by design.
  personalLine: "building things, breaking things, existing on the internet.",

  // null = refined monogram placeholder (honest, no fake image).
  // Later: `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/<hash>.png?size=512`
  avatarUrl: null,

  // Neutral until real Discord data arrives. Do NOT hardcode guesses.
  metaAccount: "Awaiting connection", // later e.g. "Since 2021" (from snowflake)
  metaBadges: "—", // later e.g. "3 badges"

  // Global accent. Later steps may derive this from the Discord profile.
  accent: "#8b8cff",
};

/* Async boundary for the future: page.js already awaits this, so
   swapping in a server-side Discord fetch later changes nothing
   in the presentation layer. */
export async function getProfile() {
  return profile;
}
