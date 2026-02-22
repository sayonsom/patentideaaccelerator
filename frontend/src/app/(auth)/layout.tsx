import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal top bar */}
      <header className="h-14 border-b border-border flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-blue-ribbon font-normal text-xl">{"\u26A1"}</span>
          <span className="font-serif font-bold text-lg text-ink">
            VoltEdge
          </span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="h-12 border-t border-border flex items-center justify-center text-xs text-neutral-light">
        &copy; {new Date().getFullYear()} VoltEdge. All rights reserved.
      </footer>
    </div>
  );
}
