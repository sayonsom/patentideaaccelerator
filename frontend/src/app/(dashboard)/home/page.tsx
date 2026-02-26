"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── Dummy company data ──────────────────────────────────────────
interface CompanyPatentData {
  id: string;
  name: string;
  logoUrl: string;
  /** Patent filings in the last 7 days */
  patents7d: number;
  /** Patent filings in the last 30 days */
  patents30d: number;
  /** Patent filings in the last year */
  patents1y: number;
}

const ALL_COMPANIES: CompanyPatentData[] = [
  {
    id: "amazon",
    name: "Amazon",
    logoUrl: "https://logo.clearbit.com/amazon.com",
    patents7d: 47,
    patents30d: 198,
    patents1y: 2_341,
  },
  {
    id: "google",
    name: "Google",
    logoUrl: "https://logo.clearbit.com/google.com",
    patents7d: 62,
    patents30d: 251,
    patents1y: 3_087,
  },
  {
    id: "meta",
    name: "Meta",
    logoUrl: "https://logo.clearbit.com/meta.com",
    patents7d: 31,
    patents30d: 142,
    patents1y: 1_756,
  },
  {
    id: "apple",
    name: "Apple",
    logoUrl: "https://logo.clearbit.com/apple.com",
    patents7d: 55,
    patents30d: 223,
    patents1y: 2_890,
  },
  {
    id: "microsoft",
    name: "Microsoft",
    logoUrl: "https://logo.clearbit.com/microsoft.com",
    patents7d: 71,
    patents30d: 287,
    patents1y: 3_412,
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    logoUrl: "https://logo.clearbit.com/nvidia.com",
    patents7d: 28,
    patents30d: 119,
    patents1y: 1_438,
  },
  {
    id: "tesla",
    name: "Tesla",
    logoUrl: "https://logo.clearbit.com/tesla.com",
    patents7d: 14,
    patents30d: 67,
    patents1y: 812,
  },
  {
    id: "ibm",
    name: "IBM",
    logoUrl: "https://logo.clearbit.com/ibm.com",
    patents7d: 83,
    patents30d: 312,
    patents1y: 3_891,
  },
  {
    id: "samsung",
    name: "Samsung",
    logoUrl: "https://logo.clearbit.com/samsung.com",
    patents7d: 91,
    patents30d: 374,
    patents1y: 4_521,
  },
  {
    id: "oracle",
    name: "Oracle",
    logoUrl: "https://logo.clearbit.com/oracle.com",
    patents7d: 19,
    patents30d: 82,
    patents1y: 967,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    logoUrl: "https://logo.clearbit.com/salesforce.com",
    patents7d: 12,
    patents30d: 54,
    patents1y: 643,
  },
  {
    id: "intel",
    name: "Intel",
    logoUrl: "https://logo.clearbit.com/intel.com",
    patents7d: 44,
    patents30d: 189,
    patents1y: 2_276,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Page ────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const [problemText, setProblemText] = useState("");

  // Follow state — persisted in localStorage for the placeholder
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = localStorage.getItem("voltedge:followed-companies");
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  function toggleFollow(companyId: string) {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      localStorage.setItem(
        "voltedge:followed-companies",
        JSON.stringify([...next])
      );
      return next;
    });
  }

  function handlePromptSubmit() {
    if (!problemText.trim()) return;
    // Navigate to idea creation with the problem pre-filled
    router.push(`/ideas/new?problem=${encodeURIComponent(problemText.trim())}`);
  }

  const followedCompanies = ALL_COMPANIES.filter((c) => followedIds.has(c.id));
  const otherCompanies = ALL_COMPANIES.filter((c) => !followedIds.has(c.id));

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* ─── Prompt Box ───────────────────────────────────────── */}
      <section>
        <h1 className="text-2xl font-serif font-bold text-ink mb-1">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-text-muted mb-5">
          Turn everyday engineering wins into defensible patents.
        </p>

        <Card className="relative overflow-hidden" padding="none">
          {/* Subtle gradient accent at top */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-ribbon via-dayflower to-mondrian-blue" />

          <div className="p-6 pt-7">
            <label
              htmlFor="problem-prompt"
              className="block text-base font-serif font-bold text-ink mb-1"
            >
              What&apos;s one big problem you solved recently?
            </label>
            <p className="text-xs text-text-muted mb-4">
              Describe a technical challenge you cracked — we&apos;ll help you
              find what&apos;s patentable about it.
            </p>

            <div className="flex gap-3">
              <textarea
                id="problem-prompt"
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder='e.g. "We built a caching layer that reduces ML inference latency by 40% using bloom filters to predict cache hits..."'
                rows={3}
                className="flex-1 rounded-lg border border-border bg-neutral-off-white px-4 py-3 text-sm text-ink placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-ribbon/40 focus:border-blue-ribbon/40 resize-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
                <span>AI will help identify inventive concepts</span>
              </div>
              <Button
                onClick={handlePromptSubmit}
                disabled={!problemText.trim()}
                size="sm"
              >
                Start ideating
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Followed Companies ───────────────────────────────── */}
      {followedCompanies.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-bold text-ink">
              Companies You Follow
            </h2>
            <span className="text-xs text-text-muted">
              {followedCompanies.length} followed
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {followedCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                isFollowed={true}
                onToggleFollow={() => toggleFollow(company.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Other Companies of Interest ──────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-ink">
            {followedCompanies.length > 0
              ? "Companies of Interest"
              : "Top Patent Filers"}
          </h2>
          <span className="text-xs text-text-muted">
            Showing {otherCompanies.length} companies
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              isFollowed={false}
              onToggleFollow={() => toggleFollow(company.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Company Card ────────────────────────────────────────────────

function CompanyCard({
  company,
  isFollowed,
  onToggleFollow,
}: {
  company: CompanyPatentData;
  isFollowed: boolean;
  onToggleFollow: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card hover className="flex flex-col" padding="none">
      <div className="p-4 pb-3">
        {/* Company header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-neutral-off-white border border-border flex items-center justify-center overflow-hidden shrink-0">
            {!imgError ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-7 h-7 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-sm font-bold text-text-muted">
                {company.name[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-ink truncate">
              {company.name}
            </h3>
          </div>
        </div>

        {/* Patent stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCell label="7 days" value={company.patents7d} />
          <StatCell label="30 days" value={company.patents30d} />
          <StatCell label="1 year" value={company.patents1y} />
        </div>
      </div>

      {/* Follow button */}
      <div className="px-4 pb-4 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFollow();
          }}
          className={`w-full py-2 rounded-md text-xs font-medium transition-all duration-150 ${
            isFollowed
              ? "bg-accent-light text-blue-ribbon hover:bg-red-50 hover:text-danger"
              : "bg-neutral-off-white text-text-secondary border border-border hover:border-blue-ribbon hover:text-blue-ribbon"
          }`}
        >
          {isFollowed ? (
            <span className="group-hover:hidden">Following</span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Follow
            </span>
          )}
        </button>
      </div>
    </Card>
  );
}

// ─── Stat Cell ───────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center rounded-md bg-neutral-off-white py-2 px-1">
      <p className="text-base font-bold text-ink leading-tight">
        {formatCount(value)}
      </p>
      <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
    </div>
  );
}
