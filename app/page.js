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

/* Share metadata uses the live Discord identity (name + avatar).
   Frontend-only: titles and images for sharing, no visual change. */
export async function generateMetadata() {
  const profile = await getProfile();
  const title = `${profile.displayName} (@${profile.username})`;
  const description =
    profile.personalLine ||
    "A personal site built on top of my Discord profile — who I am, how I work, what I keep building, and what I'm into right now.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: profile.avatarUrl,
          width: 512,
          height: 512,
          alt: `${profile.displayName} (@${profile.username})`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [profile.avatarUrl],
    },
    alternates: {
      canonical: "/",
    },
  };
}

export default async function Page() {
  const profile = await getProfile();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    alternateName: profile.username,
    description: profile.personalLine,
    image: profile.avatarUrl,
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DiscordIdentityPage data={toIdentityData(profile)} />
    </>
  );
}
