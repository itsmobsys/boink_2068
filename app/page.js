import About from "@/components/About";
import Currently from "@/components/Currently";
import Final from "@/components/Final";
import Hero from "@/components/Hero";
import ThingsIDo from "@/components/ThingsIDo";
import Vibe from "@/components/Vibe";
import { getProfile } from "@/lib/profile";

/* STEPS 1–6 (FINAL) — hero viewport, About, Vibe compiler,
   Things I Do, Currently snapshot, Final experience. Server
   component: resolves profile (live Discord identity merged with
   site-owned content) and hands slices to each section as props. */

/* ISR: Discord is re-read at most hourly — a handful of API calls
   per day, never per visitor. Editorial edits redeploy as usual. */
export const revalidate = 3600;

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
  return (
    <Hero profile={profile}>
      <About about={profile.about} />
      <Vibe vibe={profile.vibe} />
      <ThingsIDo things={profile.things} />
      <Currently currently={profile.currently} />
      <Final final={profile.final} displayName={profile.displayName} avatarUrl={profile.avatarUrl} />
    </Hero>
  );
}
