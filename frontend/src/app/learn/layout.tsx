"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function LearnNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-white border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-blue-ribbon text-xl">{"\u26A1"}</span>
            <span className="font-serif font-bold text-xl text-ink">
              VoltEdge
            </span>
          </Link>
          <span className="hidden sm:block text-neutral-light/40">|</span>
          <span className="hidden sm:block text-xs font-medium text-blue-ribbon tracking-widest uppercase">
            Learn
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-light">
          <Link
            href="/learn/patent-drill-worksheet"
            className="text-text-secondary hover:text-ink transition-colors"
          >
            Patent Drill
          </Link>
          <Link
            href="/learn/software-triz-matrix"
            className="text-text-secondary hover:text-ink transition-colors"
          >
            Software TRIZ
          </Link>
          <Link
            href="/"
            className="text-text-secondary hover:text-ink transition-colors"
          >
            Product
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-light text-text-secondary hover:text-ink transition-colors hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-blue-ribbon text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
          >
            Get early access
          </Link>
        </div>
      </div>
    </nav>
  );
}

function LearnFooter() {
  return (
    <footer className="border-t border-border">
      {/* Citation & Copyright */}
      <div className="bg-cotton-field py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-10 h-10 rounded-lg bg-ink/5 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/50">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M15 9.354a4 4 0 1 0 0 5.292" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-ink mb-2">
                Copyright &amp; Citation
              </h3>
              <p className="text-sm font-light text-text-secondary leading-relaxed mb-4">
                This framework is the proprietary intellectual property of IP
                Ramp. It is shared under{" "}
                <span className="font-medium text-ink">
                  CC BY-NC-ND 4.0
                </span>{" "}
                for educational purposes. You may share it with attribution, but
                you may not modify it or use it commercially without a license.
              </p>
              <div className="bg-white rounded-lg border border-border p-5 mb-4">
                <p className="text-[10px] font-medium text-neutral-light uppercase tracking-widest mb-3">
                  How to cite this work
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-medium text-blue-ribbon uppercase tracking-wider mb-1">
                      APA
                    </p>
                    <p className="text-xs font-light text-text-secondary leading-relaxed font-mono bg-cotton-field/50 rounded px-3 py-2">
                      IP Ramp. (2026). <em>The Three-Layer Patent Ideation Drill
                      / Software TRIZ Contradiction Matrix</em>. VoltEdge Patent
                      Ideation Platform. https://voltedge.com/learn/
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-blue-ribbon uppercase tracking-wider mb-1">
                      Workshop / Presentation
                    </p>
                    <p className="text-xs font-light text-text-secondary leading-relaxed font-mono bg-cotton-field/50 rounded px-3 py-2">
                      Framework by IP Ramp (voltedge.com). Used with permission
                      under CC BY-NC-ND 4.0.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs font-light text-neutral-light">
                For commercial licensing, workshop facilitation kits, or bulk
                organizational access, contact{" "}
                <a
                  href="mailto:learn@ipramp.com"
                  className="text-blue-ribbon hover:underline"
                >
                  learn@ipramp.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-blue-ribbon text-lg">{"\u26A1"}</span>
              <span className="font-serif font-bold text-base text-ink">
                VoltEdge
              </span>
            </Link>
            <span className="text-xs font-light text-neutral-light">
              &copy; {new Date().getFullYear()} IP Ramp. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/learn/patent-drill-worksheet"
              className="text-xs font-light text-neutral-light hover:text-text-secondary transition-colors"
            >
              Patent Drill
            </Link>
            <Link
              href="/learn/software-triz-matrix"
              className="text-xs font-light text-neutral-light hover:text-text-secondary transition-colors"
            >
              Software TRIZ
            </Link>
            <Link
              href="/"
              className="text-xs font-light text-neutral-light hover:text-text-secondary transition-colors"
            >
              Product
            </Link>
            <a
              href="#"
              className="text-xs font-light text-neutral-light hover:text-text-secondary transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-xs font-light text-neutral-light hover:text-text-secondary transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-ink flex flex-col">
      <LearnNav />
      <main className="flex-1">{children}</main>
      <LearnFooter />
    </div>
  );
}
