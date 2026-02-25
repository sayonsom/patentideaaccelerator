import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoltEdge — Discover and Monetize Patents Hiding in Your Engineering Work",
  description:
    "VoltEdge finds patentable ideas buried in the work your team already does and turns them into money. AI-powered patent discovery, Alice pre-screening, and claim generation for software teams.",
  keywords: [
    "patent discovery",
    "software patents",
    "AI patent",
    "patent monetization",
    "Section 101",
    "Alice test",
    "patent portfolio",
    "engineering IP",
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
