import { DiscordIdentityPage } from "@/components/discord-identity/DiscordIdentityPage";
import { toIdentityData } from "@/lib/discord-identity/adapt";
import { getProfile } from "@/lib/profile";

/* Claude's rebuilt frontend, wired to the existing backend.
   Server component: resolves profile (live Discord identity merged
   with site-owned content — backend contracts untouched) and adapts
   it into the DiscordIdentityData shape the new UI renders. */

/* ISR: the shell revalidates every 60s so the live presence dot
   stays fresh. Cost stays tiny regardless: the OAuth identity keeps
   its own ~1h in-memory cache and the bridge has a 60s module cache
   with dedup — neither Discord nor the bridge sees per-visitor
   traffic. Editorial edits redeploy as usual. */
export const revalidate = 60;

/* Share metadata uses the live Discord avatar (absolute CDN URL).
   Invisible change — no visual redesign. */
export async function generateMetadata() {
  const profile = await getProfile();
  return {
    openGraph: {
      title: "Digital Identity",
      description: profile.personalLine,
      images: [{ url: profile.avatarUrl }],
    },
    twitter: {
      card: "summary",
      title: "Digital Identity",
      description: profile.personalLine,
      images: [profile.avatarUrl],
    },
  };
}

export default async function Page() {
  const profile = await getProfile();
  return <DiscordIdentityPage data={toIdentityData(profile)} />;
}
