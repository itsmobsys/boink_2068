import "./globals.css";
import { MotionConfig } from "motion/react";

/* The UI uses local system stacks so the page stays instant and works
   offline in development. The visual system still exposes the same
   font variables for the scoped component styles. */

export const metadata = {
  title: {
    default: "boink — building, breaking, figuring it out",
    template: "%s · boink",
  },
  description:
    "A personal site built on top of my Discord profile — who I am, how I work, what I keep building, and what I'm into right now.",
  openGraph: {
    type: "profile",
    siteName: "boink",
    locale: "en_US",
    title: "boink — building, breaking, figuring it out",
    description:
      "A personal site built on top of my Discord profile — who I am, how I work, what I keep building, and what I'm into right now.",
  },
  twitter: {
    card: "summary",
    title: "boink — building, breaking, figuring it out",
    description:
      "A personal site built on top of my Discord profile — who I am, how I work, what I keep building, and what I'm into right now.",
  },
  robots: {
    index: true,
    follow: true,
  },
  /* empty data-URI favicon: kills the /favicon.ico 404 without adding
     an asset or changing the design (no brand mark exists yet) */
  icons: { icon: "data:," },
};

export const viewport = {
  themeColor: "#07090f",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* The reveal primitive only hides content once its JS runs —
            SSR markup renders in its natural resting state, so no-JS
            visitors already see everything. This noscript block is
            belt-and-suspenders for any cached markup that shipped with
            entrance styles inline: force the resting state. */}
        <noscript>
          <style>{`[data-scope="discord-identity"] [style*="opacity: 0"]{opacity:1 !important;filter:none !important;transform:none !important;}`}</style>
        </noscript>
        <MotionConfig reducedMotion={process.env.NODE_ENV === "production" ? "user" : "never"}>
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}
