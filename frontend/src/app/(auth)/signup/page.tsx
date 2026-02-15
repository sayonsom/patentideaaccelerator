"use client";

import { useState } from "react";
import Link from "next/link";

const ROLE_OPTIONS = [
  "Software Engineer",
  "Staff / Principal Engineer",
  "Engineering Manager",
  "CTO / VP Engineering",
  "Patent Attorney",
  "Other",
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Backend integration coming later
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-gold/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">You&apos;re on the list!</h1>
        <p className="text-sm text-text-secondary mb-6">
          We&apos;ll reach out to <span className="text-text-primary font-medium">{email}</span> when your access is ready.
        </p>
        <Link
          href="/"
          className="inline-flex px-4 py-2 rounded-lg bg-surface-card border border-border-default text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary">Request Early Access</h1>
        <p className="text-sm text-text-secondary mt-1">
          VoltEdge is currently in private beta. Join the waitlist.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-text-secondary mb-1">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
            required
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-xs font-medium text-text-secondary mb-1">
            Work email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
            required
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-xs font-medium text-text-secondary mb-1">
            Company
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-xs font-medium text-text-secondary mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-default text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
            required
          >
            <option value="" disabled>Select your role</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-accent-gold text-surface-deep font-semibold text-sm hover:bg-accent-gold/90 transition-colors"
        >
          Request Access
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
