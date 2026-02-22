"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/ideas";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCredentialsSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Sign-in failed. Please check your email and try again.");
      setLoading(false);
    } else {
      window.location.href = callbackUrl;
    }
  }

  function handleCognitoSignIn() {
    setLoading(true);
    signIn("cognito", { callbackUrl });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1">Sign in to your VoltEdge account</p>
      </div>

      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
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
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-xs font-normal text-text-secondary">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-ribbon hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3 py-2 pr-10 rounded-md bg-white border border-border text-ink text-sm placeholder:text-neutral-light focus:outline-none focus:ring-1 focus:ring-blue-ribbon focus:border-blue-ribbon transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-light hover:text-ink transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-2.5 rounded-md bg-blue-ribbon text-white font-normal text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-neutral-light">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={handleCognitoSignIn}
        disabled={loading}
        className="w-full py-2.5 rounded-md border border-border text-ink font-normal text-sm hover:bg-neutral-off-white transition-colors disabled:opacity-60"
      >
        Sign in with Single Sign-On
      </button>

      <div className="mt-6 text-center">
        <p className="text-xs text-neutral-light">
          Don&apos;t have an account?{" "}
          <Link
            href={callbackUrl !== "/ideas" ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signup"}
            className="text-blue-ribbon hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm" />}>
      <LoginForm />
    </Suspense>
  );
}
