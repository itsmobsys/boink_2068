import Hero from "@/components/Hero";
import { getProfile } from "@/lib/profile";

/* STEP 1 — one immersive hero viewport, nothing else.
   Server component: resolves profile (placeholder today, Discord
   server fetch later) and hands it to the Hero as props. */
export default async function Page() {
  const profile = await getProfile();
  return <Hero profile={profile} />;
}
