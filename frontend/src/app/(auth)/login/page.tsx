"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Auth integration coming with backend
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1">Sign in to your VoltEdge account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-text-secondary mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
            required
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 text-text-secondary">
            <input type="checkbox" className="rounded border-border-default" />
            Remember me
          </label>
          <a href="#" className="text-accent-gold hover:underline">Forgot password?</a>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-accent-gold text-surface-deep font-semibold text-sm hover:bg-accent-gold/90 transition-colors"
        >
          Sign in
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent-gold hover:underline">
            Request early access
          </Link>
        </p>
      </div>
    </div>
  );
}
