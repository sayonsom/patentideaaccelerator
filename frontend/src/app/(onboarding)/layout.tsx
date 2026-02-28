"use client";

import Link from "next/link";
import Image from "next/image";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header */}
      <header className="h-14 border-b border-border flex items-center px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/ipramp_long_logo.png"
            alt="IP Ramp"
            width={384}
            height={216}
            className="h-14 w-auto"
            priority
          />
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
