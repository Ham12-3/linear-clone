import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-product", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Orbit", template: "%s · Orbit" },
  description: "A fast, focused workspace for product teams.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f5f5f3" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
