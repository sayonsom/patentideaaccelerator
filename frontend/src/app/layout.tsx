import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoltEdge — AI Patent Ideation for Developers",
  description:
    "The first AI-powered patent platform built for software teams. Turn architecture decisions and mathematical innovations into defensible claims.",
  keywords: [
    "patent ideation",
    "software patents",
    "AI patent",
    "TRIZ",
    "invention",
    "Section 101",
    "Alice test",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-ink antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
