"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-bold text-ink mb-2">Check your email</h1>
        <p className="text-sm text-text-secondary mb-6">
          If an account exists for <span className="font-medium text-ink">{email}</span>,
          we&apos;ve sent a password reset link. It may take a minute to arrive.
        </p>
        <Link
          href="/login"
          className="text-sm text-blue-ribbon hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">Reset your password</h1>
        <p className="text-sm text-text-secondary mt-1">
          Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
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
            autoFocus
            className="w-full px-3 py-2 rounded-md bg-white border border-border text-ink text-sm placeholder:text-neutral-light focus:outline-none focus:ring-1 focus:ring-blue-ribbon focus:border-blue-ribbon transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-2.5 rounded-md bg-blue-ribbon text-white font-normal text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-xs text-blue-ribbon hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
