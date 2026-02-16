"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  function handleSignIn() {
    setLoading(true);
    signIn("cognito", { callbackUrl: "/ideas" });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1">Sign in to your VoltEdge account</p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent-gold text-surface-deep font-semibold text-sm hover:bg-accent-gold/90 transition-colors disabled:opacity-60"
        >
          {loading ? "Redirecting..." : "Sign in with VoltEdge"}
        </button>

        <p className="text-xs text-text-muted text-center">
          You&apos;ll be redirected to our secure login page powered by AWS Cognito.
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent-gold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
