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
};

export const viewport = {
  themeColor: "#060608",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <noscript>
          <style>{`.bg{opacity:1}.reveal{opacity:1}.hero__boot{display:none}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
