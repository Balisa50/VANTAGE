import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE FORGE — The App That Doesn't Believe You Until You Prove It",
  description:
    "AI-powered accountability platform that forces you to actually learn what you claim to be learning. Daily AI interrogations. Real consequences. Verified certificates.",
  keywords: ["accountability", "learning", "AI", "study", "productivity"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
