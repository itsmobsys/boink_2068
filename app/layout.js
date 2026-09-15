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
  title: "Digital Identity",
  description: "A digital identity. Revealed.",
  /* empty data-URI favicon: kills the /favicon.ico 404 without adding
     an asset or changing the design (no brand mark exists yet) */
  icons: { icon: "data:," },
};

export const viewport = {
  themeColor: "#060608",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <noscript>
          <style>{`.bg{opacity:1}.reveal{opacity:1}.hero__boot{display:none}.reveal-scroll{opacity:1;transform:none;filter:none}.reveal-scroll:not(.is-visible) .thing,.reveal-scroll:not(.is-visible) .cur-state{opacity:1}.reveal-scroll:not(.is-visible) .vibe-source__line,.reveal-scroll:not(.is-visible) .vibe-deck__wire,.reveal-scroll:not(.is-visible) .vibe-compile{opacity:1}.cur-states::before{transform:none}.hero__skill{opacity:1}.about__inner,.vibe__inner,.things__inner,.currently__inner,.final__inner{border-top-color:var(--line-soft)}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
