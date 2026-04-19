import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://theforge.app";

export const metadata: Metadata = {
  title: {
    default: "THE FORGE | The App That Doesn't Believe You Until You Prove It",
    template: "%s | THE FORGE",
  },
  description:
    "AI-powered accountability platform that forces you to actually learn what you claim to be learning. Daily AI interrogations. Real consequences. Verified certificates.",
  keywords: ["accountability", "learning", "AI", "study", "productivity", "bootcamp", "mentor", "coding"],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "THE FORGE",
    description: "The app that doesn't believe you until you prove it. Daily AI interrogations. Real consequences. Verified mastery.",
    url: BASE_URL,
    siteName: "THE FORGE",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "THE FORGE — AI-Powered Accountability Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THE FORGE",
    description: "The app that doesn't believe you until you prove it. Daily AI interrogations. Real consequences.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Forge",
  },
};

export const viewport: Viewport = {
  themeColor: "#060608",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
