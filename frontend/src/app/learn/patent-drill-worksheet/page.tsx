"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PatentDrillWorksheet from "@/components/patent-drill-worksheet";

// ─── Animation Helper ─────────────────────────────────────────

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function PatentDrillPage() {
  return (
    <div>
      <Hero />
      <WhyThisMatters />
      <Methodology />
      <InteractiveTool />
      <WorkedExamples />
      <WhenToUse />
      <CTA />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-16 pb-20 px-6 overflow-hidden">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #051C2C 1px, transparent 1px), linear-gradient(to bottom, #051C2C 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-4xl mx-auto">
        <FadeIn className="mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-accent-light border border-blue-ribbon/10">
            <span className="text-[10px] font-medium text-blue-ribbon uppercase tracking-widest">
              IP Ramp Frameworks
            </span>
            <span className="text-neutral-light/40">|</span>
            <span className="text-[10px] font-light text-text-secondary">
              Free interactive tool
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.08] mb-6 text-ink tracking-tight">
            The Three-Layer
            <br />
            Patent Ideation Drill
          </h1>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p className="text-lg md:text-xl font-light text-text-secondary max-w-2xl leading-relaxed mb-8">
            A structured worksheet that takes engineers from &ldquo;we built
            something clever&rdquo; to &ldquo;here&rsquo;s an invention
            disclosure your patent attorney can use.&rdquo; Three layers. One
            page. Works every time.
          </p>
        </FadeIn>

        <FadeIn delay={0.2} className="flex flex-wrap items-center gap-4">
          <a
            href="#tool"
            className="px-7 py-3.5 bg-blue-ribbon text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors inline-flex items-center gap-2"
          >
            Try the worksheet {"\u2193"}
          </a>
          <a
            href="#methodology"
            className="text-sm font-light text-blue-ribbon hover:text-accent-hover transition-colors inline-flex items-center gap-1"
          >
            Read the methodology {"\u2192"}
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Why This Matters ─────────────────────────────────────────

function WhyThisMatters() {
  const stats = [
    {
      number: "60%+",
      label:
        "of software patent applications are rejected under Alice/Section 101",
    },
    {
      number: "$15-25K",
      label: "wasted per filing when ideas are too abstract to survive examination",
    },
    {
      number: "1 in 3",
      label:
        "engineering teams have never filed a patent despite shipping patentable work weekly",
    },
  ];

  return (
    <section className="py-16 px-6 bg-cotton-field border-y border-border">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            The Problem
          </p>
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-ink max-w-3xl mx-auto leading-snug">
            Most engineers describe their inventions at the wrong level of
            abstraction. That kills the patent before it starts.
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <FadeIn key={stat.number} delay={i * 0.1} className="text-center">
              <div className="text-3xl md:text-4xl font-serif font-bold text-ink mb-2">
                {stat.number}
              </div>
              <p className="text-sm font-light text-text-secondary leading-relaxed">
                {stat.label}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Methodology ──────────────────────────────────────────────

function Methodology() {
  const layers = [
    {
      num: 1,
      title: "The Obvious Description",
      subtitle: "How you'd describe it in a standup",
      color: "bg-danger/10 text-danger border-danger/20",
      tag: "NOT PATENTABLE",
      description:
        "This is how most engineers describe what they built. Generic, high-level, and devoid of the specifics that make it novel. A recruiter would understand it. That's the problem.",
      example:
        "We use caching to reduce latency for our API responses.",
      test: "Would a junior engineer say 'yeah obviously'?",
    },
    {
      num: 2,
      title: "The Architectural Detail",
      subtitle: "How you'd explain it in a design review",
      color: "bg-warning/10 text-warning border-warning/20",
      tag: "MAYBE PATENTABLE",
      description:
        "Now you're adding the specific architectural choices: data structures, topology, protocols. This is where things get interesting, but we're not done yet.",
      example:
        "We use a two-tier cache \u2014 L1 in-process with LFU eviction, L2 in Redis with TTL-based expiry \u2014 where L1 keys are promoted based on access frequency weighted by recency.",
      test: "Would a senior engineer at another company say 'interesting, we didn't think of that'?",
    },
    {
      num: 3,
      title: "The Inventive Mechanism",
      subtitle: "The part you were quietly proud of building",
      color: "bg-success/10 text-success border-success/20",
      tag: "INVENTION CANDIDATE",
      description:
        "This is where patents live. The mechanism is specific, the combination is non-obvious, and it produces a measurable technical improvement. This is what your patent attorney needs.",
      example:
        "The eviction policy per cache key is dynamically selected by a lightweight gradient-boosted classifier trained on access-pattern features. The classifier is retrained incrementally every 10 minutes using the cache-miss stream as ground truth, creating a closed-loop adaptive system.",
      test: "Can you point to a specific, measurable technical improvement?",
    },
  ];

  return (
    <section id="methodology" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            The Method
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4">
            Three layers of description. One invention.
          </h2>
          <p className="text-lg font-light text-text-secondary max-w-2xl mx-auto">
            Every patentable system can be described at three levels. Most
            engineers stop at Layer 1. The patent lives in Layer 3.
          </p>
        </FadeIn>

        <div className="space-y-6">
          {layers.map((layer, i) => (
            <FadeIn key={layer.num} delay={i * 0.12}>
              <div className="bg-white rounded-xl border border-border p-7 md:p-8 relative overflow-hidden">
                {/* Layer number accent */}
                <div className="absolute -top-4 -right-4 text-[120px] font-serif font-bold text-ink/[0.03] leading-none select-none">
                  {layer.num}
                </div>

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border ${layer.color} uppercase tracking-wider`}
                    >
                      Layer {layer.num}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border ${layer.color} uppercase tracking-wider`}
                    >
                      {layer.tag}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-xl md:text-2xl text-ink mb-1">
                    {layer.title}
                  </h3>
                  <p className="text-sm font-light text-neutral-light italic mb-4">
                    {layer.subtitle}
                  </p>
                  <p className="text-sm font-light text-text-secondary leading-relaxed mb-5">
                    {layer.description}
                  </p>

                  {/* Example */}
                  <div className="bg-cotton-field rounded-lg p-5 border border-border mb-4">
                    <p className="text-[10px] font-medium text-neutral-light uppercase tracking-widest mb-2">
                      Example
                    </p>
                    <p className="text-sm font-light text-text-secondary leading-relaxed italic">
                      &ldquo;{layer.example}&rdquo;
                    </p>
                  </div>

                  {/* Gut check */}
                  <div className="flex items-start gap-2">
                    <span className="text-blue-ribbon mt-0.5 shrink-0">
                      {"\u2192"}
                    </span>
                    <p className="text-sm font-medium text-ink">
                      Gut check:{" "}
                      <span className="font-light text-text-secondary">
                        {layer.test}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Alice callout */}
        <FadeIn delay={0.4}>
          <div className="mt-10 bg-ink rounded-xl p-7 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-lg">{"\u2696\uFE0F"}</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white mb-2">
                  Why Alice / Section 101 matters
                </h3>
                <p className="text-sm font-light text-white/60 leading-relaxed mb-4">
                  The Alice v. CLS Bank Supreme Court decision established that
                  abstract ideas implemented on a generic computer are not
                  patentable. Over 60% of software patent rejections cite Alice.
                  The drill includes a built-in Alice pre-screen to ensure your
                  Layer 3 is anchored to a specific technical improvement, not
                  just an abstract business method.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-[10px] font-medium text-success uppercase tracking-wider mb-1">
                      Alice-safe
                    </p>
                    <p className="text-xs font-light text-white/50">
                      &ldquo;Reduces p99 latency by 40% using a novel
                      per-key learned eviction policy&rdquo;
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-[10px] font-medium text-danger uppercase tracking-wider mb-1">
                      Alice-risky
                    </p>
                    <p className="text-xs font-light text-white/50">
                      &ldquo;Uses AI to optimize caching for better
                      performance&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Interactive Tool ─────────────────────────────────────────

function InteractiveTool() {
  return (
    <section id="tool" className="py-20 px-6 bg-cotton-field border-y border-border">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-10">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            Interactive Worksheet
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4">
            Try it yourself
          </h2>
          <p className="text-base font-light text-text-secondary max-w-xl mx-auto">
            Think of a system or feature your team built that felt clever.
            Walk through each layer. See where the invention emerges.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          {/* Browser chrome wrapper */}
          <div className="rounded-xl border border-border shadow-2xl shadow-ink/5 overflow-hidden bg-white">
            <div className="bg-ink px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <span className="text-xs text-white/40 ml-2 font-light">
                Patent Ideation Drill &mdash; IP Ramp
              </span>
            </div>
            <PatentDrillWorksheet />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Worked Examples ──────────────────────────────────────────

function WorkedExamples() {
  const examples = [
    {
      title: "Adaptive Rate Limiter with Behavioral Trust Scoring",
      contradiction: "Throughput vs. Security",
      layers: [
        {
          level: 1,
          tag: "NOT PATENTABLE",
          tagColor: "text-danger bg-danger/10",
          text: "We use rate limiting to prevent abuse.",
        },
        {
          level: 2,
          tag: "MAYBE PATENTABLE",
          tagColor: "text-warning bg-warning/10",
          text: "We use a token bucket rate limiter with per-user quotas stored in Redis, with sliding window counters to handle burst patterns.",
        },
        {
          level: 3,
          tag: "INVENTION CANDIDATE",
          tagColor: "text-success bg-success/10",
          text: "Each user's token replenishment rate is dynamically adjusted based on a behavioral trust score computed from request entropy (URL diversity, temporal distribution, payload variance). High-entropy users get higher limits automatically; low-entropy users (bot-like patterns) get progressively throttled. The trust score is updated per-request using an exponentially weighted moving average.",
        },
      ],
    },
    {
      title: "ML Feature Store with Point-in-Time Consistency",
      contradiction: "Data Freshness vs. Consistency",
      layers: [
        {
          level: 1,
          tag: "NOT PATENTABLE",
          tagColor: "text-danger bg-danger/10",
          text: "We store features for our ML models in a feature store.",
        },
        {
          level: 2,
          tag: "MAYBE PATENTABLE",
          tagColor: "text-warning bg-warning/10",
          text: "We use a dual-write feature store where online features go to Redis and offline features go to a Parquet-based lake, with a reconciliation job that checks for drift.",
        },
        {
          level: 3,
          tag: "INVENTION CANDIDATE",
          tagColor: "text-success bg-success/10",
          text: "Feature reads for inference are point-in-time consistent by attaching a logical timestamp (derived from the triggering event's Kafka offset) to every feature request. The store maintains a per-feature versioned log and serves the latest version that precedes the request timestamp, guaranteeing train-serve parity without duplicating storage.",
        },
      ],
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            Worked Examples
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4">
            See the drill in action
          </h2>
          <p className="text-base font-light text-text-secondary max-w-xl mx-auto">
            Two real engineering scenarios walked through all three layers.
            Notice how the same system transforms as you add specificity.
          </p>
        </FadeIn>

        <div className="space-y-8">
          {examples.map((ex, i) => (
            <FadeIn key={ex.title} delay={i * 0.1}>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="px-7 py-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif font-bold text-lg text-ink">
                    {ex.title}
                  </h3>
                  <span className="text-[10px] font-medium px-3 py-1 rounded-full bg-accent-light text-blue-ribbon uppercase tracking-wider">
                    {ex.contradiction}
                  </span>
                </div>

                {/* Layers */}
                <div className="divide-y divide-border">
                  {ex.layers.map((layer) => (
                    <div key={layer.level} className="px-7 py-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${layer.tagColor} uppercase tracking-wider`}
                        >
                          Layer {layer.level}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${layer.tagColor} uppercase tracking-wider`}
                        >
                          {layer.tag}
                        </span>
                      </div>
                      <p className="text-sm font-light text-text-secondary leading-relaxed">
                        {layer.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── When to Use ──────────────────────────────────────────────

function WhenToUse() {
  const useCases = [
    {
      title: "Invention Disclosure Meetings",
      description:
        "Give this worksheet to every engineer before they walk into an invention disclosure session. They arrive with Layer 3 specificity instead of Layer 1 generalities.",
    },
    {
      title: "Patent Sprint Kickoffs",
      description:
        "Use it as the first exercise in a 72-hour patent sprint. Teams complete one worksheet per candidate idea, then the group reviews which Layer 3s are strongest.",
    },
    {
      title: "Architecture Reviews",
      description:
        "After a design review or ADR approval, ask the team: can you fill out all three layers for what you just decided? If they can, it's worth a patent conversation.",
    },
    {
      title: "Onboarding Senior Engineers",
      description:
        "New hires often bring patentable ideas from their previous work. The worksheet helps them articulate what was novel in their past systems without revealing trade secrets.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-cotton-field border-y border-border">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            Applications
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4">
            When to use this drill
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((uc, i) => (
            <FadeIn key={uc.title} delay={i * 0.08}>
              <div className="bg-white rounded-xl border border-border p-7 h-full">
                <h3 className="font-medium text-ink mb-2">{uc.title}</h3>
                <p className="text-sm font-light text-text-secondary leading-relaxed">
                  {uc.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 px-6 bg-ink">
      <FadeIn className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-6">
          Ready for more?
        </p>
        <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-6 leading-tight">
          The worksheet is free.
          <br />
          The platform does the rest.
        </h2>
        <p className="text-base font-light text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          VoltEdge combines this drill with AI-powered ideation, automatic Alice
          scoring, prior art search, and claim generation. One tool. Zero wasted
          attorney hours.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 bg-blue-ribbon text-white text-base font-medium rounded-lg hover:bg-accent-hover transition-colors"
          >
            Get early access
          </Link>
          <Link
            href="/learn/software-triz-matrix"
            className="text-sm font-light text-white/60 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Try the Software TRIZ Matrix {"\u2192"}
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
