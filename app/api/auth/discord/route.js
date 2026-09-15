/* GET /api/auth/discord — owner-only OAuth entry point.
   ───────────────────────────────────────────────────────────────
   NOT a visitor login: this route exists so the SITE OWNER can
   authorize once (identify scope) and obtain a refresh token to
   save as DISCORD_REFRESH_TOKEN. Nothing is persisted server-side
   here; no navigation links to this route anywhere on the site.

   Security: random per-attempt `state` in an httpOnly cookie =
   CSRF protection for the callback. Secrets stay in env. */

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buildAuthorizeUrl } from "@/lib/discord-utils.mjs";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "discord_oauth_state";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !process.env.DISCORD_CLIENT_SECRET || !redirectUri) {
    return Response.json(
      { error: "Discord OAuth is not configured on the server." },
      { status: 503 }
    );
  }

  const state = randomBytes(32).toString("hex");
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // single attempt window: 10 minutes
    path: "/api/auth/discord/callback",
  });

  redirect(buildAuthorizeUrl({ clientId, redirectUri, state }));
}
