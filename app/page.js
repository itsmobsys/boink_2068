import About from "@/components/About";
import Hero from "@/components/Hero";
import Vibe from "@/components/Vibe";
import { getProfile } from "@/lib/profile";

/* STEPS 1–3 — hero viewport, About section, Vibe compiler.
   Server component: resolves profile (placeholder today, Discord
   server fetch later) and hands slices to each section as props. */
export default async function Page() {
  const profile = await getProfile();
  return (
    <Hero profile={profile}>
      <About about={profile.about} />
      <Vibe vibe={profile.vibe} />
    </Hero>
  );
}
