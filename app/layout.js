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
  description:
    "A personal site built on top of my Discord profile — who I am, how I work, what I keep building, and what I'm into right now.",
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
        {/* The new reveal primitive (motion/react) only hides content
            once its JS runs — SSR markup renders in its natural resting
            state, so no-JS visitors already see everything. */}
        {children}
      </body>
    </html>
  );
}
