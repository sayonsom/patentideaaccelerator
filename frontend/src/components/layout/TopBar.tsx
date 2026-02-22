"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSprintStore } from "@/lib/store";

const BREADCRUMB_LABELS: Record<string, string> = {
  ideas: "Ideas",
  new: "New Idea",
  frameworks: "Frameworks",
  "prior-art": "Prior Art",
  sprints: "Sprints",
  settings: "Settings",
  teams: "Teams",
  admin: "Admin",
  alignment: "Alignment",
  portfolio: "Portfolio",
  landscaping: "Landscaping",
  members: "Members",
  goals: "Goals",
  join: "Join Team",
};

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const activeSprint = useSprintStore((s) => s.activeSprint);

  function resolveLabel(seg: string, i: number): string {
    if (isUUID(seg) && segments[i - 1] === "sprints" && activeSprint?.id === seg) {
      return activeSprint.name;
    }
    return BREADCRUMB_LABELS[seg] ?? seg;
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-white">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const label = resolveLabel(seg, i);
          const isLast = i === segments.length - 1;
          return (
            <span key={href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-neutral-light">/</span>}
              {isLast ? (
                <span className="text-ink font-medium">{label}</span>
              ) : (
                <Link href={href} className="text-text-secondary hover:text-ink transition-colors">
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Context-aware primary action */}
      <div className="flex items-center gap-3">
        {(() => {
          const base = "/" + segments[0];
          // Only show CTA on pages where it makes contextual sense
          if (base === "/settings" || base === "/admin" || base === "/alignment") return null;
          const cta = {
            "/sprints": { href: "/sprints", label: "New Sprint" },
            "/teams": { href: "/teams/new", label: "Create Team" },
            "/portfolio": { href: "/portfolio", label: "New Portfolio" },
            "/landscaping": { href: "/landscaping", label: "New Session" },
          }[base] ?? { href: "/ideas/new", label: "New Idea" };
          return (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-ribbon text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {cta.label}
            </Link>
          );
        })()}
      </div>
    </header>
  );
}
