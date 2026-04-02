import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-three-chi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "VANTAGE — AI-Powered Tech Intelligence",
  description:
    "AI-native tech intelligence platform with tri-signal analysis. Every story cross-referenced across news wires, Reddit, and HackerNews. Global regional coverage.",
  openGraph: {
    title: "VANTAGE — AI-Powered Tech Intelligence",
    description:
      "Tri-signal tech intelligence. News + Reddit + HackerNews, analyzed by AI.",
    type: "website",
    siteName: "Vantage",
  },
  twitter: {
    card: "summary_large_image",
    title: "VANTAGE — AI-Powered Tech Intelligence",
    description:
      "Tri-signal tech intelligence. News + Reddit + HackerNews, analyzed by AI.",
  },
  alternates: {
    types: {
      "application/rss+xml": `${siteUrl}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
