"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  function handleSignUp() {
    setLoading(true);
    // Cognito hosted UI has a sign-up tab — same OAuth flow
    signIn("cognito", { callbackUrl: "/ideas" });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary">Create your account</h1>
        <p className="text-sm text-text-secondary mt-1">
          Get started with VoltEdge — AI-powered patent ideation.
        </p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent-gold text-surface-deep font-semibold text-sm hover:bg-accent-gold/90 transition-colors disabled:opacity-60"
        >
          {loading ? "Redirecting..." : "Create Account"}
        </button>

        <p className="text-xs text-text-muted text-center">
          You&apos;ll be redirected to create your account securely via AWS Cognito.
          Use the &quot;Sign up&quot; tab on the login page.
        </p>
      </div>

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
