import About from "@/components/About";
import Currently from "@/components/Currently";
import Final from "@/components/Final";
import Hero from "@/components/Hero";
import ThingsIDo from "@/components/ThingsIDo";
import Vibe from "@/components/Vibe";
import { getProfile } from "@/lib/profile";

/* STEPS 1–6 (FINAL) — hero viewport, About, Vibe compiler,
   Things I Do, Currently snapshot, Final experience. Server
   component: resolves profile (placeholder today, Discord server
   fetch later) and hands slices to each section as props. */
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
