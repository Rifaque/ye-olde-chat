import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { homeSeo } from "@/lib/seo";
import { siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Each page sets its own canonical URL; none is inherited from here.
  title: { default: homeSeo.title, template: `%s | ${siteName}` },
  description: homeSeo.description,
  applicationName: siteName,
};

export const viewport: Viewport = {
  themeColor: "#120e0f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
