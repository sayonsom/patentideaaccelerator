"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignupForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Extract invite code from callbackUrl if present (e.g. /teams/join?code=AB12CD34)
  function getOnboardingUrl(): string {
    let onboardingUrl = "/onboarding";
    if (callbackUrl) {
      try {
        const url = new URL(callbackUrl, window.location.origin);
        const inviteCode = url.searchParams.get("code");
        if (inviteCode) {
          onboardingUrl += `?invite=${inviteCode}`;
        }
      } catch {
        // invalid URL, ignore
      }
    }
    return onboardingUrl;
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      name: name.trim(),
      redirect: false,
    });

    if (res?.error) {
      setError("Sign-up failed. Please try again.");
      setLoading(false);
    } else {
      window.location.href = getOnboardingUrl();
    }
  }

  function handleCognitoSignUp() {
    setLoading(true);
    signIn("cognito", { callbackUrl: getOnboardingUrl() });
  }

  // Detect corporate email for UI hint
  const PERSONAL_DOMAINS = new Set([
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in",
    "hotmail.com", "outlook.com", "live.com", "msn.com",
    "icloud.com", "me.com", "mac.com", "proton.me",
    "protonmail.com", "pm.me", "aol.com", "zoho.com",
  ]);
  const emailDomain = email.trim().split("@")[1]?.toLowerCase() ?? "";
  const isCorporateEmail = emailDomain.length > 0 && !PERSONAL_DOMAINS.has(emailDomain);

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">Create your account</h1>
        <p className="text-sm text-text-secondary mt-1">
          Get started with VoltEdge — AI-powered patent ideation.
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-normal text-text-secondary mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            required
            className="w-full px-3 py-2 rounded-md bg-white border border-border text-ink text-sm placeholder:text-neutral-light focus:outline-none focus:ring-1 focus:ring-blue-ribbon focus:border-blue-ribbon transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-normal text-text-secondary mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full px-3 py-2 rounded-md bg-white border border-border text-ink text-sm placeholder:text-neutral-light focus:outline-none focus:ring-1 focus:ring-blue-ribbon focus:border-blue-ribbon transition-colors"
          />
          {isCorporateEmail && (
            <p className="text-[11px] text-success mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              Corporate account &mdash; you can join your company&apos;s organization after setup
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-normal text-text-secondary mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
            className="w-full px-3 py-2 rounded-md bg-white border border-border text-ink text-sm placeholder:text-neutral-light focus:outline-none focus:ring-1 focus:ring-blue-ribbon focus:border-blue-ribbon transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim() || !name.trim()}
          className="w-full py-2.5 rounded-md bg-blue-ribbon text-white font-normal text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-neutral-light">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={handleCognitoSignUp}
        disabled={loading}
        className="w-full py-2.5 rounded-md border border-border text-ink font-normal text-sm hover:bg-neutral-off-white transition-colors disabled:opacity-60"
      >
        Sign up with Single Sign-On
      </button>

      <div className="mt-6 text-center">
        <p className="text-xs text-neutral-light">
          Already have an account?{" "}
          <Link
            href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
            className="text-blue-ribbon hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm" />}>
      <SignupForm />
    </Suspense>
  );
}
