import "./globals.css";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";

/* next/font hosts the files at build time — no render-blocking
   external stylesheet, same families as the Step 1 design. */
const display = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--next-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--next-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--next-mono",
  display: "swap",
});

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
  themeColor: "#08090c",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {/* The reveal primitive only hides content once its JS runs —
            SSR markup renders in its natural resting state, so no-JS
            visitors already see everything. This noscript block is
            belt-and-suspenders for any cached markup that shipped with
            entrance styles inline: force the resting state. */}
        <noscript>
          <style>{`[data-scope="discord-identity"] [style*="opacity: 0"]{opacity:1 !important;filter:none !important;transform:none !important;}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
