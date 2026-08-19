import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-ab.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "VANTAGE - Technology briefing",
  description:
    "Technology stories from six regions, written up and scored as they break.",
  openGraph: {
    title: "VANTAGE - Technology briefing",
    description:
      "Technology stories from six regions, written up and scored as they break.",
    type: "website",
    siteName: "Vantage",
  },
  twitter: {
    card: "summary_large_image",
    title: "VANTAGE - Technology briefing",
    description:
      "Technology stories from six regions, written up and scored as they break.",
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
