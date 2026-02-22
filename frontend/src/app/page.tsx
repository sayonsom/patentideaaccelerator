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
    <div className="min-h-screen bg-white text-ink">
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
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-blue-ribbon font-normal text-xl">{"\u26A1"}</span>
          <span className="font-serif font-bold text-lg text-ink">
            VoltEdge
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <a href="#how-it-works" className="text-text-secondary hover:text-ink transition-colors">How it works</a>
          <a href="#capabilities" className="text-text-secondary hover:text-ink transition-colors">Features</a>
          <a href="#matrix-demo" className="text-text-secondary hover:text-ink transition-colors">Contradiction Matrix</a>
          <a href="#gccs" className="text-text-secondary hover:text-ink transition-colors">GCCs</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-text-secondary hover:text-ink transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-blue-ribbon text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors"
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
        <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight text-ink">
          Patent ideation at the{" "}
          <span className="text-blue-ribbon">voltage</span> and{" "}
          <span className="text-blue-ribbon">velocity</span> your team ships code
        </h1>
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
          AI-powered invention workflows built for software engineers.
          Go from &quot;we built something clever&quot; to defensible patent claims.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-3.5 bg-blue-ribbon text-white font-normal rounded-md text-base hover:bg-accent-hover transition-colors"
          >
            Request Early Access
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-3.5 border border-border text-text-secondary font-normal rounded-md text-base hover:text-ink hover:border-border-hover transition-colors"
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
    <section className="border-y border-border py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
        {items.map((item, i) => (
          <div key={item.word} className="flex items-center gap-4">
            {i > 0 && <span className="hidden sm:block text-neutral-light text-2xl">{"\u2022"}</span>}
            <div className="text-center">
              <span className="text-blue-ribbon font-serif font-bold text-lg">{item.word}</span>
              <p className="text-xs text-neutral-light">{item.desc}</p>
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
    { number: "0", label: "Tools built for how software teams actually invent \u2014 until now." },
  ];
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-serif text-3xl font-bold mb-4 text-ink">The Gap</h2>
        <p className="text-text-secondary mb-12 max-w-2xl mx-auto">
          Software engineers invent every day. But the tools for turning those inventions into patents were designed for mechanical engineers in the 1970s.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.number} className="bg-neutral-off-white rounded-lg p-6 border border-border">
              <div className="text-3xl font-semibold text-blue-ribbon mb-2">{s.number}</div>
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
    <section id="how-it-works" className="py-20 px-6 bg-cotton-field">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-serif text-3xl font-bold mb-12 text-ink">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-ribbon font-semibold text-lg">{s.num}</span>
              </div>
              <h3 className="font-medium text-ink mb-2">{s.title}</h3>
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
        <h2 className="font-serif text-3xl font-bold mb-4 text-ink">Capabilities</h2>
        <p className="text-text-secondary mb-12 max-w-2xl mx-auto">
          Six integrated tools that take your team from &quot;huh, that&apos;s clever&quot; to &quot;here are the claims.&quot;
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-lg p-6 border border-border text-left hover:border-blue-ribbon/30 hover:shadow-sm transition-all">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-medium text-ink mb-2">{f.title}</h3>
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
  // Default: Throughput (3) vs Consistency (2) — always yields results
  const [improvingId, setImprovingId] = useState<number | null>(3);
  const [worseningId, setWorseningId] = useState<number | null>(2);

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
    <section id="matrix-demo" className="py-20 px-6 bg-cotton-field">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold mb-4 text-ink">Software Contradiction Matrix</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            The first contradiction matrix designed specifically for software engineering.
            30 parameters, 15 inventive principles, and the trade-offs your team faces every day.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-normal text-success mb-1.5">Improving</label>
              <select
                value={improvingId ?? ""}
                onChange={(e) => setImprovingId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 text-sm bg-neutral-off-white border border-border rounded-md text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
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
              <label className="block text-sm font-normal text-danger mb-1.5">Worsening</label>
              <select
                value={worseningId ?? ""}
                onChange={(e) => setWorseningId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 text-sm bg-neutral-off-white border border-border rounded-md text-ink focus:outline-none focus:ring-1 focus:ring-blue-ribbon"
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
            <div className="mb-4 px-4 py-3 rounded-md bg-accent-light border border-blue-ribbon/20">
              <p className="text-xs text-text-secondary">
                Improving <span className="text-success font-normal">{improving.name}</span>
                {" "}while preserving{" "}
                <span className="text-danger font-normal">{worsening.name}</span>
              </p>
            </div>
          )}

          {principles.length > 0 ? (
            <div className="space-y-3">
              {principles.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-3 rounded-md bg-neutral-off-white border border-border">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent-light text-blue-ribbon text-xs font-normal shrink-0">
                    {p.id}
                  </span>
                  <div>
                    <h4 className="text-sm font-medium text-ink">{p.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">{p.description}</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {p.softwareExamples.slice(0, 2).map((ex, i) => (
                        <li key={i} className="text-xs text-neutral-light flex items-start gap-1">
                          <span className="text-blue-ribbon">{"\u2022"}</span> {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : improvingId && worseningId ? (
            <p className="text-sm text-neutral-light text-center py-4">
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
        <h2 className="font-serif text-3xl font-bold mb-4 text-ink">
          Software Gets <span className="text-blue-ribbon">1,580+</span> GCCs Per Year
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
              <span className="text-blue-ribbon shrink-0 mt-0.5">{"\u2713"}</span>
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
    <section className="py-20 px-6 bg-cotton-field">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-serif text-3xl font-bold mb-12 text-ink">Who VoltEdge Is For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((p) => (
            <div key={p.title} className="bg-white rounded-lg p-6 border border-border">
              <h3 className="font-medium text-ink mb-2 text-sm">{p.title}</h3>
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
        <h2 className="font-serif text-3xl font-bold mb-4 text-ink">
          Start turning your engineering into IP
        </h2>
        <p className="text-text-secondary mb-8">
          Join the waitlist and be among the first teams to use VoltEdge.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3.5 bg-blue-ribbon text-white font-normal rounded-md text-base hover:bg-accent-hover transition-colors"
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
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-ribbon font-normal">{"\u26A1"}</span>
          <span className="font-serif font-bold text-ink">
            VoltEdge
          </span>
          <span className="text-xs text-neutral-light ml-2">&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-neutral-light">
          <a href="#" className="hover:text-text-secondary transition-colors">Privacy</a>
          <a href="#" className="hover:text-text-secondary transition-colors">Terms</a>
          <a href="https://github.com/sayonsom/patentideaaccelerator" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
