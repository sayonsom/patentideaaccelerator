"use client";

import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header */}
      <header className="h-14 border-b border-border flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-blue-ribbon text-lg">&#9889;</span>
          <span className="font-serif font-bold text-ink text-lg">VoltEdge</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
