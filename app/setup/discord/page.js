/* /setup/discord — owner-only Discord setup (UNLINKED route).
   ───────────────────────────────────────────────────────────────
   No navigation points here; visitors never need it. Shows config
   PRESENCE (never values): static env, persistent store state, and
   where the runtime refresh token currently resolves from. Rendered
   dynamically so env changes reflect without a rebuild. */

import { getDiscordStatus } from "@/lib/discord.js";

export const dynamic = "force-dynamic";

export const metadata = { title: "Discord Setup" };

function Row({ ok, children }) {
  return (
    <li>
      <span aria-hidden="true">{ok ? "● " : "○ "}</span>
      {children}
    </li>
  );
}

const SOURCE_LABEL = {
  store: "persistent store (rotations save automatically)",
  env: "DISCORD_REFRESH_TOKEN env seed (rotations need a store)",
};

export default async function DiscordSetupPage() {
  const status = await getDiscordStatus();

  return (
    <main
      style={{
        background: "#060608",
        color: "#ededf1",
        minHeight: "100svh",
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        fontSize: 14,
        lineHeight: 1.7,
        maxWidth: 640,
        margin: "0 auto",
        padding: "8vh 24px",
      }}
    >
      <p style={{ color: "#62626e", letterSpacing: "0.3em", fontSize: 11 }}>OWNER ONLY · UNLINKED ROUTE</p>
      <h1>Discord setup</h1>
      <p>
        Status: <strong>{status.linked ? "Linked" : "Not linked"}</strong>
      </p>
      <ul>
        <Row ok={status.hasClientId}>DISCORD_CLIENT_ID</Row>
        <Row ok={status.hasClientSecret}>DISCORD_CLIENT_SECRET</Row>
        <Row ok={status.hasRedirectUri}>DISCORD_REDIRECT_URI</Row>
        <Row ok={status.storeAvailable}>Persistent token store (Upstash Redis)</Row>
      </ul>
      <p>
        Refresh token source:{" "}
        <strong>{status.tokenSource ? SOURCE_LABEL[status.tokenSource] : "none — authorize below"}</strong>
      </p>
      <ol>
        <li>Create an application at discord.com/developers, add an OAuth2 redirect to your DISCORD_REDIRECT_URI.</li>
        <li>Set the static variables above (Vercel → Settings → Environment Variables), then redeploy.</li>
        <li>
          For automatic rotation handling, attach an Upstash Redis database (Vercel Marketplace) so
          UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set — no code changes needed.
        </li>
        <li>
          <a href="/api/auth/discord" style={{ color: "#8b8cff" }}>
            Authorize with Discord
          </a>{" "}
          (identify scope only). With a store configured the token saves itself; otherwise save the
          shown token as DISCORD_REFRESH_TOKEN.
        </li>
        <li>If the refresh token is ever revoked (status falls back), authorize again once — the store reseeds.</li>
      </ol>
      <p>
        <a href="/" style={{ color: "#8b8cff" }}>
          ← Back to the site
        </a>
      </p>
    </main>
  );
}
