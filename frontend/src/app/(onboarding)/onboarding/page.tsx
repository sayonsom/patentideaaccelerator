"use client";

import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Spinner } from "@/components/ui";
import { INTEREST_CATEGORIES, ALL_INTERESTS } from "@/lib/constants";
import { completeOnboarding, acceptTerms } from "@/lib/actions/users";
import { redeemTeamInvite } from "@/lib/actions/teams-management";
import { redeemOrgInvite } from "@/lib/actions/organizations";

// ─── Step indicator ──────────────────────────────────────────────

const STEPS = [
  { label: "Welcome", id: "welcome" },
  { label: "Terms", id: "terms" },
  { label: "Experience", id: "experience" },
  { label: "Interests", id: "interests" },
  { label: "Get Started", id: "path" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-normal shrink-0
              transition-all duration-300
              ${i < current
                ? "bg-success text-white"
                : i === current
                  ? "bg-blue-ribbon text-white"
                  : "bg-neutral-off-white text-neutral-light border border-border"
              }
            `}
          >
            {i < current ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-px mx-2 transition-colors duration-300 ${
                i < current ? "bg-success" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Interest tag picker ─────────────────────────────────────────

function InterestPicker({
  selected,
  onChange,
  excludeTags,
  title,
  subtitle,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
  excludeTags?: Set<string>;
  title: string;
  subtitle: string;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  function toggleTag(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  const categoryEntries = Object.entries(INTEREST_CATEGORIES);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-serif font-bold text-ink mb-2">{title}</h2>
      <p className="text-sm text-neutral-dark mb-6">{subtitle}</p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 p-3 rounded-lg bg-neutral-off-white">
          {selected.map((tag) => {
            const info = ALL_INTERESTS.find((t) => t.tag === tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-normal bg-white border border-border text-ink hover:border-danger hover:text-danger transition-colors"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: info?.color ?? "#A2AAAD" }}
                />
                {tag}
                <svg className="w-3 h-3 ml-0.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-1">
        {categoryEntries.map(([category, { color, tags }]) => {
          const availableTags = excludeTags
            ? tags.filter((t) => !excludeTags.has(t))
            : tags;
          if (availableTags.length === 0) return null;

          const isExpanded = expandedCategory === category;
          const selectedInCategory = availableTags.filter((t) => selected.includes(t)).length;

          return (
            <div key={category} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-off-white transition-colors"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-ink flex-1">{category}</span>
                {selectedInCategory > 0 && (
                  <span className="text-[10px] font-normal bg-blue-ribbon text-white px-1.5 py-0.5 rounded-full">
                    {selectedInCategory}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-neutral-light transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5 animate-fade-in">
                  {availableTags.map((tag) => {
                    const active = selected.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`
                          px-2.5 py-1.5 rounded-md text-xs font-normal transition-all duration-150
                          ${active
                            ? "bg-blue-ribbon text-white shadow-sm"
                            : "bg-neutral-off-white text-neutral-dark hover:bg-accent-light hover:text-blue-ribbon"
                          }
                        `}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main onboarding page ────────────────────────────────────────

function OnboardingContent() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("invite") ?? "";

  const [step, setStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [commsAccepted, setCommsAccepted] = useState(false);
  const [experienceAreas, setExperienceAreas] = useState<string[]>([]);
  const [emergingInterests, setEmergingInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinMode, setJoinMode] = useState(!!inviteFromUrl);
  const [joinCode, setJoinCode] = useState(inviteFromUrl);
  const [joinError, setJoinError] = useState("");
  const [autoRedeemDone, setAutoRedeemDone] = useState(false);

  const userName = session?.user?.name ?? "there";

  async function handleAcceptTerms() {
    if (!session?.user?.id || !termsAccepted) return;
    setSaving(true);
    setError(null);
    try {
      await acceptTerms(session.user.id);
      setSaving(false);
      setStep(2);
    } catch {
      setSaving(false);
      setError("Failed to save. Please try again.");
    }
  }

  async function handleComplete(destination: string) {
    if (!session?.user?.id) {
      setError("You must be signed in to continue. Please log in first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await completeOnboarding(session.user.id, {
        experienceAreas,
        emergingInterests,
      });
      if (!result) {
        throw new Error("Failed to save your preferences. Please try again.");
      }

      // If user came via invite link, auto-redeem the invite code
      if (inviteFromUrl && !autoRedeemDone) {
        setAutoRedeemDone(true);
        try {
          const teamResult = await redeemTeamInvite(inviteFromUrl, session.user.id);
          if (teamResult.success && teamResult.teamId) {
            await updateSession();
            window.location.href = `/teams/${teamResult.teamId}`;
            return;
          }
          const orgResult = await redeemOrgInvite(inviteFromUrl, session.user.id);
          if (orgResult.success) {
            await updateSession();
            window.location.href = "/teams";
            return;
          }
        } catch {
          // Invite redemption failed, continue to intended destination
        }
      }

      // Full page reload so the browser picks up the fresh JWT cookie.
      // router.push() uses client-side navigation which can race with
      // the cookie update from updateSession(), causing middleware to
      // still see the old onboardingComplete=false JWT.
      await updateSession();
      window.location.href = destination;
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div>
      <StepIndicator current={step} />

      {/* Invite code banner */}
      {inviteFromUrl && (
        <div className="mb-6 p-3 rounded-lg bg-accent-light border border-blue-ribbon/20 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-ribbon shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          <p className="text-xs text-blue-ribbon">
            You&apos;ve been invited to join a team! Complete your profile and you&apos;ll be added automatically.
          </p>
        </div>
      )}

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div className="animate-fade-in text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">&#9889;</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-3">
            Welcome to VoltEdge, {userName}
          </h1>
          <p className="text-neutral-dark text-sm leading-relaxed max-w-md mx-auto mb-8">
            Turn your engineering breakthroughs into defensible patents.
            We&apos;ll help you set up your profile in under a minute.
          </p>
          <Button variant="primary" size="lg" onClick={() => setStep(1)}>
            Let&apos;s get started
          </Button>
        </div>
      )}

      {/* Step 1: Terms & Privacy */}
      {step === 1 && (
        <div className="animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-blue-ribbon flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-ribbon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-serif font-bold text-ink mb-2 text-center">Data and privacy</h2>
          <p className="text-sm text-neutral-dark mb-8 text-center max-w-md mx-auto">
            We take privacy seriously. We do not use documents uploaded to our platform to train our models. We&apos;re also GDPR compliant.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <div className="space-y-4 max-w-md mx-auto">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-blue-ribbon focus:ring-blue-ribbon focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <span className="text-sm text-ink leading-relaxed">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-ribbon hover:underline font-medium"
                >
                  Terms of Service and the Data Protection Agreement
                </a>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={commsAccepted}
                  onChange={(e) => setCommsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-blue-ribbon focus:ring-blue-ribbon focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <span className="text-sm text-ink leading-relaxed">
                I agree to receive communications from VoltEdge
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button
              variant="primary"
              size="lg"
              disabled={!termsAccepted || saving}
              loading={saving}
              onClick={handleAcceptTerms}
            >
              Next &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Experience */}
      {step === 2 && (
        <div>
          <InterestPicker
            selected={experienceAreas}
            onChange={setExperienceAreas}
            title="What do you work with?"
            subtitle="Select the technologies and domains you have hands-on experience in."
          />
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(3)}
                className="text-xs text-neutral-light hover:text-ink transition-colors"
              >
                Skip
              </button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                disabled={experienceAreas.length === 0}
              >
                Continue ({experienceAreas.length} selected)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Emerging Interests */}
      {step === 3 && (
        <div>
          <InterestPicker
            selected={emergingInterests}
            onChange={setEmergingInterests}
            excludeTags={new Set(experienceAreas)}
            title="What are you curious about?"
            subtitle="Select emerging areas you'd like to explore for patent-worthy inventions."
          />
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(4)}
                className="text-xs text-neutral-light hover:text-ink transition-colors"
              >
                Skip
              </button>
              <Button
                variant="primary"
                onClick={() => setStep(4)}
                disabled={emergingInterests.length === 0}
              >
                Continue ({emergingInterests.length} selected)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Choose path */}
      {step === 4 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-serif font-bold text-ink mb-2">How would you like to start?</h2>
          <p className="text-sm text-neutral-dark mb-8">
            You can always change this later. Teams, solo, or both &mdash; it&apos;s up to you.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {saving ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-3 text-sm text-neutral-dark">Saving your preferences...</span>
            </div>
          ) : (
            <>
            <div className="grid gap-3">
              {/* Start Solo */}
              <button
                onClick={() => handleComplete("/ideas")}
                className="group flex items-start gap-4 p-5 rounded-lg border border-border hover:border-blue-ribbon hover:shadow-sm transition-all duration-150 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0 group-hover:bg-blue-ribbon/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-ribbon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink mb-0.5">Start Solo</h3>
                  <p className="text-xs text-neutral-dark">Begin brainstorming patent ideas on your own. Fast and focused.</p>
                </div>
              </button>

              {/* Create a Team */}
              <button
                onClick={() => handleComplete("/teams/new")}
                className="group flex items-start gap-4 p-5 rounded-lg border border-border hover:border-blue-ribbon hover:shadow-sm transition-all duration-150 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0 group-hover:bg-blue-ribbon/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-ribbon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink mb-0.5">Create a Team</h3>
                  <p className="text-xs text-neutral-dark">Set up a team and invite colleagues for collaborative invention sprints.</p>
                </div>
              </button>

              {/* Join a Team */}
              <button
                onClick={() => setJoinMode(true)}
                className={`group flex items-start gap-4 p-5 rounded-lg border transition-all duration-150 text-left ${
                  joinMode
                    ? "border-blue-ribbon shadow-sm"
                    : "border-border hover:border-blue-ribbon hover:shadow-sm"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center shrink-0 group-hover:bg-blue-ribbon/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-ribbon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-ink mb-0.5">Join a Team</h3>
                  <p className="text-xs text-neutral-dark">Have an invite code? Join an existing team to start collaborating.</p>
                </div>
              </button>
            </div>

            {/* Inline invite code input */}
            {joinMode && (
              <div className="mt-4 p-4 rounded-lg border border-border bg-neutral-off-white animate-fade-in">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label="Invite Code"
                      placeholder="e.g. AB12CD34"
                      value={joinCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
                        setJoinCode(value);
                        setJoinError("");
                      }}
                      maxLength={8}
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="primary"
                    disabled={joinCode.length !== 8 || saving}
                    loading={saving}
                    onClick={async () => {
                      if (!session?.user?.id || joinCode.length !== 8) return;
                      setSaving(true);
                      setJoinError("");
                      try {
                        // Try team invite first
                        const teamResult = await redeemTeamInvite(joinCode, session.user.id);
                        if (teamResult.success && teamResult.teamId) {
                          await handleComplete("/teams");
                          return;
                        }
                        // Fall back to org invite
                        const orgResult = await redeemOrgInvite(joinCode, session.user.id);
                        if (orgResult.success) {
                          await handleComplete("/teams");
                          return;
                        }
                        setSaving(false);
                        setJoinError("Invalid or expired invite code. Please check and try again.");
                      } catch {
                        setSaving(false);
                        setJoinError("Failed to join. Please try again.");
                      }
                    }}
                  >
                    Join
                  </Button>
                </div>
                {joinError && (
                  <p className="text-sm text-danger mt-2">{joinError}</p>
                )}
                <button
                  onClick={() => handleComplete("/teams/join")}
                  className="text-xs text-neutral-light hover:text-ink transition-colors mt-3 inline-block"
                >
                  I don&apos;t have a code yet
                </button>
              </div>
            )}
          </>
          )}

          <div className="mt-6">
            <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
