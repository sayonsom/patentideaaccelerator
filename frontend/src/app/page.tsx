"use client";

import { useState } from "react";
import Link from "next/link";
import {
  lookupContradiction,
  getParameterById,
  getParametersByCategory,
} from "@/lib/software-principles";
import type { ParameterCategory } from "@/lib/types";

// ─── Landing Page ──────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-deep text-text-primary">
      <StickyNav />
      <Hero />
      <TaglineBar />
      <TheGap />
      <HowItWorks />
      <Capabilities />
      <MatrixDemo />
      <GCCSection />
      <WhoIsFor />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// ─── Sticky Nav ────────────────────────────────────────────────

function StickyNav() {
  return (
    <nav className="sticky top-0 z-50 bg-surface-deep/90 backdrop-blur-md border-b border-border-default">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent-gold font-bold text-xl">{"\u26A1"}</span>
          <span className="font-display font-bold text-lg">
            <span className="text-accent-gold">Volt</span>Edge
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <a href="#how-it-works" className="text-text-secondary hover:text-text-primary transition-colors">How it works</a>
          <a href="#capabilities" className="text-text-secondary hover:text-text-primary transition-colors">Features</a>
          <a href="#matrix-demo" className="text-text-secondary hover:text-text-primary transition-colors">Contradiction Matrix</a>
          <a href="#gccs" className="text-text-secondary hover:text-text-primary transition-colors">GCCs</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-accent-gold text-surface-deep text-sm font-semibold rounded-lg hover:bg-accent-gold/90 transition-colors"
          >
            Request Early Access
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ──────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative py-24 px-6 text-center overflow-hidden">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Patent ideation at the{" "}
          <span className="text-accent-gold">voltage</span> and{" "}
          <span className="text-accent-gold">velocity</span> your team ships code
        </h1>
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
          AI-powered invention workflows built for software engineers.
          Go from &quot;we built something clever&quot; to defensible patent claims.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-3.5 bg-accent-gold text-surface-deep font-semibold rounded-lg text-base hover:bg-accent-gold/90 transition-colors"
          >
            Request Early Access
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-3.5 border border-border-default text-text-secondary font-medium rounded-lg text-base hover:text-text-primary hover:border-text-muted transition-colors"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Tagline Bar ───────────────────────────────────────────────

function TaglineBar() {
  const items = [
    { word: "Voltage", desc: "AI-amplified inventive power" },
    { word: "Velocity", desc: "Ship patents at dev speed" },
    { word: "Edge", desc: "Competitive moat through IP" },
  ];
  return (
    <section className="border-y border-border-default py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
        {items.map((item, i) => (
          <div key={item.word} className="flex items-center gap-4">
            {i > 0 && <span className="hidden sm:block text-border-default text-2xl">{"\u2022"}</span>}
            <div className="text-center">
              <span className="text-accent-gold font-display font-bold text-lg">{item.word}</span>
              <p className="text-xs text-text-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── The Gap ───────────────────────────────────────────────────

function TheGap() {
  const stats = [
    { number: "60K+", label: "Software patents filed yearly in the US" },
    { number: "1973", label: "TRIZ was invented\u2014before software existed" },
    { number: "60%+", label: "Of software patents face Alice/101 rejections" },
    { number: "0", label: "Tools built for how software teams actually invent" },
  ];
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold mb-4">The Gap</h2>
        <p className="text-text-secondary mb-12 max-w-2xl mx-auto">
          Software engineers invent every day. But the tools for turning those inventions into patents were designed for mechanical engineers in the 1970s.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.number} className="bg-surface-panel rounded-xl p-6 border border-border-default">
              <div className="text-3xl font-bold text-accent-gold mb-2">{s.number}</div>
              <p className="text-xs text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { num: "1", title: "Describe", desc: "Tell us the problem you solved and the tech stack you used." },
    { num: "2", title: "Invent", desc: "AI applies software-specific inventive frameworks to generate patent concepts." },
    { num: "3", title: "Validate", desc: "Alice/Section 101 pre-screening ensures eligibility before you spend on lawyers." },
    { num: "4", title: "File", desc: "Export claim skeletons and prior art reports ready for patent counsel." },
  ];
  return (
    <section id="how-it-works" className="py-20 px-6 bg-surface-panel">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-accent-gold font-bold text-lg">{s.num}</span>
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{s.title}</h3>
              <p className="text-sm text-text-secondary">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Capabilities ──────────────────────────────────────────────

function Capabilities() {
  const features = [
    {
      icon: "\u2728",
      title: "AI Ideation",
      desc: "Claude-powered idea generation using TRIZ, SIT, C-K Theory, and analogy frameworks tailored for software.",
    },
    {
      icon: "\u2696\uFE0F",
      title: "Alice Pre-Screener",
      desc: "Section 101 eligibility scoring before you spend a dollar on patent counsel. Score 0-100 with actionable recommendations.",
    },
    {
      icon: "\u26A1",
      title: "Software Contradiction Matrix",
      desc: "30 software parameters and 15 inventive principles. The first contradiction matrix built for code, not gears.",
    },
    {
      icon: "\uD83D\uDD0D",
      title: "Patent Search",
      desc: "Search Google Patents filtered by software CPC classes. Prior art results inline with your ideas.",
    },
    {
      icon: "\uD83D\uDCDD",
      title: "Claim Skeleton Generator",
      desc: "AI-generated method, system, and CRM claims following patent best practices.",
    },
    {
      icon: "\uD83D\uDE80",
      title: "Invention Sprints",
      desc: "72-hour structured team sprints: Foundation (20 concepts) \u2192 Validation (10 ideas) \u2192 Filing (5 patents).",
    },
  ];

  return (
    <section id="capabilities" className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Capabilities</h2>
        <p className="text-text-secondary mb-12 max-w-2xl mx-auto">
          Six integrated tools that take your team from &quot;huh, that&apos;s clever&quot; to &quot;here are the claims.&quot;
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-surface-panel rounded-xl p-6 border border-border-default text-left hover:border-accent-gold/30 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Matrix Demo ───────────────────────────────────────────────

function MatrixDemo() {
  const [improvingId, setImprovingId] = useState<number | null>(1); // Response Latency
  const [worseningId, setWorseningId] = useState<number | null>(9); // Data Consistency

  const grouped = getParametersByCategory();
  const catOrder: ParameterCategory[] = [
    "performance", "scale", "reliability", "security", "data",
    "architecture", "engineering", "operations", "ai_ml", "product", "integration",
  ];
  const catLabels: Record<string, string> = {
    performance: "Performance", scale: "Scale", reliability: "Reliability",
    security: "Security", data: "Data", architecture: "Architecture",
    engineering: "Engineering", operations: "Operations", ai_ml: "AI/ML",
    product: "Product", integration: "Integration",
  };

  const principles = improvingId && worseningId
    ? lookupContradiction(improvingId, worseningId)
    : [];

  const improving = improvingId ? getParameterById(improvingId) : null;
  const worsening = worseningId ? getParameterById(worseningId) : null;

  return (
    <section id="matrix-demo" className="py-20 px-6 bg-surface-panel">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-4">Software Contradiction Matrix</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            The first contradiction matrix designed specifically for software engineering.
            30 parameters, 15 inventive principles, and the trade-offs your team faces every day.
          </p>
        </div>

        <div className="bg-surface-deep rounded-xl border border-border-default p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-green-400 mb-1.5">Improving</label>
              <select
                value={improvingId ?? ""}
                onChange={(e) => setImprovingId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 text-sm bg-surface-panel border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
              >
                <option value="">Select parameter...</option>
                {catOrder.map((cat) => (
                  <optgroup key={cat} label={catLabels[cat]}>
                    {(grouped[cat] ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-red-400 mb-1.5">Worsening</label>
              <select
                value={worseningId ?? ""}
                onChange={(e) => setWorseningId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 text-sm bg-surface-panel border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
              >
                <option value="">Select parameter...</option>
                {catOrder.map((cat) => (
                  <optgroup key={cat} label={catLabels[cat]}>
                    {(grouped[cat] ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {improving && worsening && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-accent-gold/5 border border-accent-gold/20">
              <p className="text-xs text-text-secondary">
                Improving <span className="text-green-400 font-medium">{improving.name}</span>
                {" "}while preserving{" "}
                <span className="text-red-400 font-medium">{worsening.name}</span>
              </p>
            </div>
          )}

          {principles.length > 0 ? (
            <div className="space-y-3">
              {principles.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-panel border border-border-default">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent-gold/10 text-accent-gold text-xs font-bold shrink-0">
                    {p.id}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{p.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">{p.description}</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {p.softwareExamples.slice(0, 2).map((ex, i) => (
                        <li key={i} className="text-xs text-text-muted flex items-start gap-1">
                          <span className="text-accent-gold">{"\u2022"}</span> {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : improvingId && worseningId ? (
            <p className="text-sm text-text-muted text-center py-4">
              No specific mapping for this combination. Try different parameters.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── GCCs ──────────────────────────────────────────────────────

function GCCSection() {
  return (
    <section id="gccs" className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold mb-4">
          Software Gets <span className="text-accent-gold">1,580+</span> GCCs Per Year
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto mb-8">
          Google Certified Claims prove software is one of the most active patent domains.
          Your team is likely sitting on patentable inventions right now.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {[
            "Distributed systems patterns (sharding, consensus, replication)",
            "ML inference optimization (quantization, distillation, serving)",
            "Security mechanisms (zero-trust, homomorphic encryption)",
            "Developer tools (build systems, observability, testing)",
            "Data pipeline innovations (streaming, CDC, schema evolution)",
            "Cloud-native patterns (service mesh, sidecar, operator pattern)",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span className="text-accent-gold shrink-0 mt-0.5">{"\u2713"}</span>
              <span className="text-sm text-text-secondary">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Who Is For ────────────────────────────────────────────────

function WhoIsFor() {
  const personas = [
    {
      title: "Staff / Principal Engineers",
      desc: "You solve hard problems daily. Turn those solutions into IP that compounds your impact.",
    },
    {
      title: "Engineering Managers",
      desc: "Build a patent culture without slowing down delivery. Sprints fit into your existing cadence.",
    },
    {
      title: "CTOs / VPs of Engineering",
      desc: "Patent portfolio as competitive moat. Demonstrate technical depth to investors and acquirers.",
    },
    {
      title: "Patent Attorneys",
      desc: "Receive pre-screened ideas with technical detail, Alice analysis, and claim skeletons ready to draft.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-surface-panel">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold mb-12">Who VoltEdge Is For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((p) => (
            <div key={p.title} className="bg-surface-deep rounded-xl p-6 border border-border-default">
              <h3 className="font-semibold text-text-primary mb-2 text-sm">{p.title}</h3>
              <p className="text-xs text-text-secondary">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-20 px-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-3xl font-bold mb-4">
          Start turning your engineering into IP
        </h2>
        <p className="text-text-secondary mb-8">
          Join the waitlist and be among the first teams to use VoltEdge.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3.5 bg-accent-gold text-surface-deep font-semibold rounded-lg text-base hover:bg-accent-gold/90 transition-colors"
        >
          Request Early Access
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border-default py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-accent-gold font-bold">{"\u26A1"}</span>
          <span className="font-display font-bold">
            <span className="text-accent-gold">Volt</span>Edge
          </span>
          <span className="text-xs text-text-muted ml-2">&copy; 2025</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-text-muted">
          <a href="#" className="hover:text-text-secondary transition-colors">Privacy</a>
          <a href="#" className="hover:text-text-secondary transition-colors">Terms</a>
          <a href="https://github.com/sayonsom/patentideaaccelerator" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
