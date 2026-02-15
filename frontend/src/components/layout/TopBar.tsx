"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BREADCRUMB_LABELS: Record<string, string> = {
  ideas: "Ideas",
  new: "New Idea",
  frameworks: "Frameworks",
  "prior-art": "Prior Art",
  sprints: "Sprints",
  settings: "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border-default bg-surface-panel">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const label = BREADCRUMB_LABELS[seg] ?? seg;
          const isLast = i === segments.length - 1;
          return (
            <span key={href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-text-muted">/</span>}
              {isLast ? (
                <span className="text-text-primary font-medium">{label}</span>
              ) : (
                <Link href={href} className="text-text-secondary hover:text-text-primary transition-colors">
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/ideas/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-gold text-surface-deep text-sm font-semibold hover:bg-accent-gold/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Idea
        </Link>
      </div>
    </header>
  );
}
