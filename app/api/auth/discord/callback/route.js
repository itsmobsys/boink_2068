/* GET /api/auth/discord/callback — owner-only OAuth callback.
   ───────────────────────────────────────────────────────────────
   1. Reject blindly-accepted callbacks: `code` + `state` required,
      state must match the httpOnly cookie (timing-safe), then the
      cookie is cleared (single use).
   2. Exchange the single-use code server-side (secret never leaves
      env), fetch /users/@me, normalize to the safe subset.
   3. Persist the refresh token through the token-store abstraction.
      When a persistent backend is configured this completes linking
      with zero manual steps; otherwise fall back to showing the
      token once for a manual DISCORD_REFRESH_TOKEN save (previous
      behavior, local-dev friendly).
   Nothing is stored unencrypted client-side, nothing is logged with
   values, nothing is sent to any other party.

   Error pages are deliberately vague — details go to server logs
   with credentials scrubbed, never to the browser. */

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { exchangeTokens, fetchMe, redactError } from "@/lib/discord.js";
import { tokenStore, TokenStoreError } from "@/lib/discord-token-store.mjs";
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

    // Persist through the abstraction: with a configured backend this
    // is the last manual step forever — rotations store themselves.
    let stored = false;
    try {
      await tokenStore.setRefreshToken(tokens.refresh_token);
      stored = true;
    } catch (err) {
      if (err instanceof TokenStoreError) {
        console.error(`[discord] callback token persist skipped (${err.code}); showing manual fallback`);
      } else {
        throw err;
      }
    }

    const storedNote = stored
      ? `<p>Refresh token stored in the persistent token store <strong>automatically</strong> — ` +
        `nothing to copy, future rotations will store themselves. You can close this tab.</p>`
      : `<p>No persistent token store is configured, so save this refresh token as ` +
        `<strong>DISCORD_REFRESH_TOKEN</strong> ` +
        `(Vercel → project → Settings → Environment Variables), then redeploy. ` +
        `It is shown exactly once, only to you, right now:</p>` +
        `<code>${escapeHtml(tokens.refresh_token)}</code>`;

    return page(
      200,
      "Discord connected",
      `<p>Authorized as <strong>${escapeHtml(profile.globalName || profile.username)}</strong> ` +
        `(@${escapeHtml(profile.username)} · ${escapeHtml(profile.id)}).</p>` +
        storedNote +
        `<p class="dim">The access token from this grant was used once and discarded — ` +
        `it is not stored anywhere. Runtime access is minted server-side from the stored refresh token.</p>` +
        `<p><a href="/">← Back to the site</a></p>`
    );
  } catch (err) {
    console.error(`[discord] callback failed: ${redactError(err)}`);
    return page(
      500,
      "Connection failed",
      `<p>Discord did not complete the exchange. Check the server configuration and ` +
        `<a href="/setup/discord">try again</a>. <span class="dim">Details are in the server logs.</span></p>`
    );
  }
}
