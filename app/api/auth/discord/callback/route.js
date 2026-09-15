/* GET /api/auth/discord/callback — owner-only OAuth callback.
   ───────────────────────────────────────────────────────────────
   1. Reject blindly-accepted callbacks: `code` + `state` required,
      state must match the httpOnly cookie (timing-safe), then the
      cookie is cleared (single use).
   2. Exchange the single-use code server-side (secret never leaves
      env), fetch /users/@me, normalize to the safe subset.
   3. Respond with an owner-only HTML page showing the normalized
      profile + the refresh token to save as DISCORD_REFRESH_TOKEN.
      Nothing is stored, logged, or sent to any other party.

   Error pages are deliberately vague — details go to server logs
   with credentials scrubbed, never to the browser. */

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { exchangeTokens, fetchMe } from "@/lib/discord.js";
import { escapeHtml, normalizeUser } from "@/lib/discord-utils.mjs";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "discord_oauth_state";

function page(status, title, body) {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>${escapeHtml(title)}</title>` +
      `<style>body{background:#060608;color:#ededf1;font:14px/1.7 ui-monospace,Menlo,Consolas,monospace;` +
      `max-width:640px;margin:8vh auto;padding:0 24px}a{color:#8b8cff}code{display:block;background:#0a0a0e;` +
      `border:1px solid rgba(255,255,255,.09);border-radius:10px;padding:12px 14px;margin:14px 0;` +
      `word-break:break-all;user-select:all}li{margin:6px 0}.dim{color:#62626e}</style></head>` +
      `<body><h1>${escapeHtml(title)}</h1>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function statesMatch(a, b) {
  try {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export async function GET(request) {
  const store = await cookies();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = store.get(STATE_COOKIE)?.value;
  // Single-use by design: consume the cookie whatever happens next.
  store.delete(STATE_COOKIE);

  if (url.searchParams.get("error")) {
    return page(400, "Authorization declined", `<p>Discord reported an error and no code was issued. <a href="/setup/discord">Try again</a>.</p>`);
  }
  if (!code || !statesMatch(state, expected)) {
    return page(
      400,
      "Invalid callback",
      `<p class="dim">Missing authorization code or mismatched state. ` +
        `Start again from <a href="/setup/discord">/setup/discord</a> — never open this URL directly.</p>`
    );
  }

  try {
    const tokens = await exchangeTokens({ code });
    if (!tokens.refresh_token || !tokens.access_token) {
      throw new Error("Discord omitted tokens from the grant.");
    }
    const profile = normalizeUser(await fetchMe(tokens.access_token));
    if (!profile) throw new Error("Discord returned an unusable profile.");

    return page(
      200,
      "Discord connected",
      `<p>Authorized as <strong>${escapeHtml(profile.globalName || profile.username)}</strong> ` +
        `(@${escapeHtml(profile.username)} · ${escapeHtml(profile.id)}).</p>` +
        `<p>Save this refresh token as <strong>DISCORD_REFRESH_TOKEN</strong> ` +
        `(Vercel → project → Settings → Environment Variables), then redeploy. ` +
        `It is shown exactly once, only to you, right now:</p>` +
        `<code>${escapeHtml(tokens.refresh_token)}</code>` +
        `<p class="dim">The access token from this grant was used once and discarded — ` +
        `it is not stored anywhere. Runtime access is minted server-side from the refresh token.</p>` +
        `<p><a href="/">← Back to the site</a></p>`
    );
  } catch (err) {
    console.error(`[discord] callback failed: ${err instanceof Error ? err.message : "unknown"}`);
    return page(
      500,
      "Connection failed",
      `<p>Discord did not complete the exchange. Check the server configuration and ` +
        `<a href="/setup/discord">try again</a>. <span class="dim">Details are in the server logs.</span></p>`
    );
  }
}
