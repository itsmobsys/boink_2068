/* /setup/discord — owner-only Discord setup (UNLINKED route).
   ───────────────────────────────────────────────────────────────
   No navigation points here; visitors never need it. Shows config
   PRESENCE (never values), the exact steps to connect, and the
   entry point. Rendered dynamically so env changes reflect without
   a rebuild for this page alone. */

import { isDiscordConfigured } from "@/lib/discord.js";

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

export default async function DiscordSetupPage() {
  const hasId = Boolean(process.env.DISCORD_CLIENT_ID);
  const hasSecret = Boolean(process.env.DISCORD_CLIENT_SECRET);
  const hasRedirect = Boolean(process.env.DISCORD_REDIRECT_URI);
  const hasRefresh = Boolean(process.env.DISCORD_REFRESH_TOKEN);
  const live = isDiscordConfigured();

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
        Status: <strong>{live ? "Connected (refresh token present)" : "Not connected"}</strong>
      </p>
      <ul>
        <Row ok={hasId}>DISCORD_CLIENT_ID</Row>
        <Row ok={hasSecret}>DISCORD_CLIENT_SECRET</Row>
        <Row ok={hasRedirect}>DISCORD_REDIRECT_URI</Row>
        <Row ok={hasRefresh}>DISCORD_REFRESH_TOKEN</Row>
      </ul>
      <ol>
        <li>Create an application at discord.com/developers, add an OAuth2 redirect to your DISCORD_REDIRECT_URI.</li>
        <li>Set the four variables above (Vercel → Settings → Environment Variables), then redeploy.</li>
        <li>
          <a href="/api/auth/discord" style={{ color: "#8b8cff" }}>
            Authorize with Discord
          </a>{" "}
          (identify scope only) and save the shown refresh token.
        </li>
      </ol>
      <p>
        <a href="/" style={{ color: "#8b8cff" }}>
          ← Back to the site
        </a>
      </p>
    </main>
  );
}
