import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-three-chi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "VANTAGE — Tech Intelligence",
  description:
    "Sharp analysis on the tech stories that matter, published the moment they break. Global coverage. No editors. No agenda.",
  openGraph: {
    title: "VANTAGE — Tech Intelligence",
    description:
      "Sharp analysis on the tech stories that matter. Global coverage across 6 regions.",
    type: "website",
    siteName: "Vantage",
  },
  twitter: {
    card: "summary_large_image",
    title: "VANTAGE — Tech Intelligence",
    description:
      "Sharp analysis on the tech stories that matter. Global coverage across 6 regions.",
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
