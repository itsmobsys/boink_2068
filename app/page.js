import About from "@/components/About";
import Hero from "@/components/Hero";
import { getProfile } from "@/lib/profile";

/* STEPS 1–2 — immersive hero viewport, then the About section.
   Server component: resolves profile (placeholder today, Discord
   server fetch later) and hands slices to each section as props. */
export default async function Page() {
  const profile = await getProfile();
  return (
    <Hero profile={profile}>
      <About about={profile.about} />
    </Hero>
  );
}
