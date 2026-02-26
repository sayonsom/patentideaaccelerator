"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import SoftwareTRIZMatrix from "@/components/software-triz-matrix";

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

export default function SoftwareTRIZPage() {
  return (
    <div>
      <Hero />
      <WhyThisMatters />
      <UnifiedMethodology />
      <HowItWorks />
      <InteractiveTool />
      <Walkthrough />
      <PrincipleHighlights />
      <CTA />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-16 pb-20 px-6 overflow-hidden">
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
            Software TRIZ
            <br />
            Contradiction Matrix
          </h1>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p className="text-lg md:text-xl font-light text-text-secondary max-w-2xl leading-relaxed mb-8">
            40 inventive principles adapted for software engineering. 16
            performance parameters. 240 mapped contradictions. The engineering
            trade-offs you fight every day are inventions waiting to happen.
          </p>
        </FadeIn>

        <FadeIn delay={0.2} className="flex flex-wrap items-center gap-4">
          <a
            href="#tool"
            className="px-7 py-3.5 bg-blue-ribbon text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors inline-flex items-center gap-2"
          >
            Explore the matrix {"\u2193"}
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-light text-blue-ribbon hover:text-accent-hover transition-colors inline-flex items-center gap-1"
          >
            Learn the method {"\u2192"}
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Why This Matters ─────────────────────────────────────────

function WhyThisMatters() {
  return (
    <section className="py-16 px-6 bg-cotton-field border-y border-border">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            Background
          </p>
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-ink max-w-3xl mx-auto leading-snug mb-4">
            TRIZ was invented for physical engineering. We rebuilt it for
            software.
          </h2>
          <p className="text-base font-light text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Classical TRIZ (Theory of Inventive Problem Solving) uses 39
            engineering parameters and 40 inventive principles derived from
            studying 200,000+ patents. But &ldquo;weight of a moving
            object&rdquo; and &ldquo;shape&rdquo; don&rsquo;t map to
            microservices. We adapted the entire framework for modern software
            systems.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FadeIn>
            <div className="bg-white rounded-xl border border-border p-6 text-center">
              <div className="text-3xl font-serif font-bold text-ink mb-2">
                16
              </div>
              <p className="text-sm font-light text-text-secondary">
                Software parameters (latency, throughput, scalability,
                consistency, security, etc.)
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-white rounded-xl border border-border p-6 text-center">
              <div className="text-3xl font-serif font-bold text-ink mb-2">
                40
              </div>
              <p className="text-sm font-light text-text-secondary">
                Inventive principles rewritten with software examples
                (microservices, caching, streaming, etc.)
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="bg-white rounded-xl border border-border p-6 text-center">
              <div className="text-3xl font-serif font-bold text-ink mb-2">
                240
              </div>
              <p className="text-sm font-light text-text-secondary">
                Contradiction cells mapped to specific inventive strategies for
                resolving software trade-offs
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ─── Unified Methodology ──────────────────────────────────────

function UnifiedMethodology() {
  return (
    <section className="py-20 px-6 bg-ink">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            The IP Ramp Method
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-[2.75rem] text-white leading-snug mb-4">
            The principle is the compass.
            <br />
            The mechanism is the patent.
          </h2>
          <p className="text-base font-light text-white/50 max-w-2xl mx-auto leading-relaxed">
            TRIZ tells you <em className="text-white/70">where to look</em>.
            The Three-Layer Drill tells you <em className="text-white/70">how deep to go</em>.
            The Alice Pre-Screen tells you <em className="text-white/70">if it will survive</em>.
            Together, they form one continuous workflow from engineering trade-off to defensible patent.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                label: "Contradiction",
                desc: "Name the trade-off: what improves vs. what worsens",
                color: "text-blue-ribbon",
                bg: "bg-blue-ribbon/10",
                border: "border-blue-ribbon/20",
              },
              {
                step: "02",
                label: "Principles",
                desc: "Look up the matrix cell \u2192 get 3 inventive directions",
                color: "text-blue-ribbon",
                bg: "bg-blue-ribbon/10",
                border: "border-blue-ribbon/20",
              },
              {
                step: "03",
                label: "Three-Layer Drill",
                desc: "Obvious \u2192 Architectural \u2192 Inventive mechanism",
                color: "text-success",
                bg: "bg-success/10",
                border: "border-success/20",
                link: "/learn/patent-drill-worksheet",
              },
              {
                step: "04",
                label: "Alice Pre-Screen",
                desc: "4 questions to verify your Layer 3 is patent-safe",
                color: "text-warning",
                bg: "bg-warning/10",
                border: "border-warning/20",
              },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={0.15 + i * 0.08}>
                <div className={`rounded-xl p-5 border ${s.border} ${s.bg} h-full relative`}>
                  <span className={`text-[10px] font-bold ${s.color} uppercase tracking-widest`}>
                    Step {s.step}
                  </span>
                  <h3 className="font-medium text-white text-sm mt-2 mb-1">
                    {s.label}
                  </h3>
                  <p className="text-xs font-light text-white/50 leading-relaxed">
                    {s.desc}
                  </p>
                  {s.link && (
                    <Link
                      href={s.link}
                      className="text-[10px] font-medium text-success hover:text-success/80 mt-3 inline-flex items-center gap-1 transition-colors"
                    >
                      Open drill worksheet {"\u2192"}
                    </Link>
                  )}
                  {/* Connector arrow (hidden on mobile) */}
                  {i < 3 && (
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-white/20 text-lg">
                      {"\u2192"}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.5}>
          <p className="text-center text-xs font-light text-white/30 mt-8">
            This methodology is derived from 200,000+ patent analyses. Each step builds on the last.
            Skipping steps produces weaker patents.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Identify your contradiction",
      description:
        "Every non-trivial engineering decision involves a trade-off. Find the parameter you want to improve (the ROW) and the parameter that worsens as a result (the COLUMN). Be specific \u2014 \u201Cperformance\u201D is too vague; \u201Clatency\u201D or \u201Cthroughput\u201D is precise.",
      example:
        "\"We need to improve Latency, but every approach we've tried worsens Consistency.\"",
    },
    {
      num: "02",
      title: "Read the cell and look up principles",
      description:
        "The cell at the intersection contains 3 inventive principle IDs, ordered by relevance. Look each up in the Principle Quick Reference. Each principle is a general strategy \u2014 a compass heading, not GPS coordinates.",
      example:
        "Latency (row) vs. Consistency (column) \u2192 Principles: 16 (Partial Action), 4 (Asymmetry), 13 (The Other Way Around)",
    },
    {
      num: "03",
      title: "Apply the Three-Layer Drill",
      subtitle: "This is where most teams fail \u2014 and where patents are born",
      description:
        "Use the principle as a starting direction, then describe your solution at three levels of depth. Layer 1 is the obvious description (not patentable). Layer 2 adds architectural detail (maybe patentable). Layer 3 describes the inventive mechanism \u2014 the specific, novel, non-obvious way you resolved the contradiction. Layer 3 is the patent.",
      example:
        "Layer 1: \"We use eventual consistency.\" Layer 2: \"We use optimistic locking with version vectors in a CRDT-based store.\" Layer 3: \"Each partition maintains a causal dependency graph that prunes stale writes using vector clock compression, reducing conflict resolution from O(n\u00B2) to O(log n) while preserving causal ordering guarantees across geo-distributed replicas.\"",
      link: { href: "/learn/patent-drill-worksheet", label: "Open the full Three-Layer Drill" },
    },
    {
      num: "04",
      title: "Run the Alice / Section 101 pre-screen",
      subtitle: "Four questions that predict whether your patent survives",
      description:
        "Before you spend $15\u201325K filing, ask four questions about your Layer 3: Does it improve a technical process (not just a business outcome)? Is the improvement tied to a specific mechanism (not \u201Cusing AI to optimize\u201D)? Would it require a specific implementation to work? Is there something unconventional about how components interact?",
      example:
        "Good: \"Reduces p99 latency by 40% using per-key learned eviction.\" Bad: \"Uses AI to optimize caching for better performance.\" The first is Alice-safe. The second gets rejected.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            The Full Method
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4">
            From trade-off to patent in four steps
          </h2>
          <p className="text-base font-light text-text-secondary max-w-2xl mx-auto">
            The TRIZ matrix is Step 1. What you do after &mdash; the Three-Layer
            Drill and Alice pre-screen &mdash; is what separates a clever
            observation from a defensible patent.
          </p>
        </FadeIn>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.1}>
              <div className="flex gap-6 md:gap-8">
                <div className="shrink-0">
                  <span className="block w-12 h-12 rounded-xl bg-accent-light border border-blue-ribbon/10 text-blue-ribbon font-serif font-bold text-lg flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <div className="flex-1 pb-6 border-b border-border last:border-0">
                  <h3 className="font-serif font-bold text-lg text-ink mb-1">
                    {step.title}
                  </h3>
                  {step.subtitle && (
                    <p className="text-xs font-medium text-blue-ribbon mb-2">
                      {step.subtitle}
                    </p>
                  )}
                  <p className="text-sm font-light text-text-secondary leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <div className="bg-cotton-field rounded-lg p-4 border border-border">
                    <p className="text-xs font-light text-text-secondary leading-relaxed italic">
                      {step.example}
                    </p>
                  </div>
                  {step.link && (
                    <Link
                      href={step.link.href}
                      className="text-sm font-light text-blue-ribbon hover:text-accent-hover transition-colors inline-flex items-center gap-1 mt-3"
                    >
                      {step.link.label} {"\u2192"}
                    </Link>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Key insight callout */}
        <FadeIn delay={0.5}>
          <div className="mt-10 bg-cotton-field rounded-xl p-6 md:p-8 border border-border text-center">
            <p className="font-serif font-bold text-xl md:text-2xl text-ink mb-2">
              &ldquo;The principle is the compass. The mechanism is the patent.&rdquo;
            </p>
            <p className="text-sm font-light text-text-secondary max-w-lg mx-auto">
              TRIZ principles give you a direction. Your specific, non-obvious
              implementation &mdash; the Layer 3 mechanism &mdash; is what gets
              granted.
            </p>
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
      <div className="max-w-[1400px] mx-auto">
        <FadeIn className="text-center mb-10">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            Interactive Matrix
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4">
            Explore the matrix
          </h2>
          <p className="text-base font-light text-text-secondary max-w-xl mx-auto">
            Click any cell to see which inventive principles resolve that
            specific contradiction. Toggle to the principles catalog to browse
            all 40.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-border shadow-2xl shadow-ink/5 overflow-hidden bg-white">
            <div className="bg-ink px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <span className="text-xs text-white/40 ml-2 font-light">
                Software TRIZ Contradiction Matrix &mdash; IP Ramp
              </span>
            </div>
            <SoftwareTRIZMatrix />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Walkthrough ──────────────────────────────────────────────

function Walkthrough() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            Worked Example
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4">
            A real contradiction, resolved
          </h2>
        </FadeIn>

        <FadeIn>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Scenario */}
            <div className="px-7 py-6 border-b border-border">
              <p className="text-[10px] font-medium text-neutral-light uppercase tracking-widest mb-3">
                Scenario
              </p>
              <h3 className="font-serif font-bold text-xl text-ink mb-2">
                Building an ML inference API with strict latency SLAs
              </h3>
              <p className="text-sm font-light text-text-secondary leading-relaxed">
                The team needs to serve model predictions under 50ms p99, but
                the model accuracy improves significantly with ensemble methods
                that take 200ms+. Improving latency degrades accuracy.
                Improving accuracy worsens latency.
              </p>
            </div>

            {/* Matrix lookup */}
            <div className="px-7 py-6 border-b border-border bg-cotton-field/50">
              <p className="text-[10px] font-medium text-blue-ribbon uppercase tracking-widest mb-3">
                Matrix Lookup
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20">
                  Improving: Latency
                </span>
                <span className="text-xs text-neutral-light">vs</span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-danger/10 text-danger border border-danger/20">
                  Worsens: Accuracy
                </span>
                <span className="text-xs text-neutral-light mx-2">
                  {"\u2192"}
                </span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent-light text-blue-ribbon border border-blue-ribbon/20">
                  Principles: 21, 16, 31
                </span>
              </div>
            </div>

            {/* Principles applied */}
            <div className="px-7 py-6 border-b border-border">
              <p className="text-[10px] font-medium text-neutral-light uppercase tracking-widest mb-4">
                Principles Applied
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <span className="w-8 h-8 rounded-lg bg-accent-light text-blue-ribbon text-xs font-bold flex items-center justify-center shrink-0">
                    21
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink mb-1">
                      Skipping (Lazy evaluation, sampling, probabilistic data
                      structures)
                    </p>
                    <p className="text-xs font-light text-text-secondary leading-relaxed">
                      Instead of running all ensemble models, use a lightweight
                      router that predicts which sub-model will dominate for
                      each input and only runs that one.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="w-8 h-8 rounded-lg bg-accent-light text-blue-ribbon text-xs font-bold flex items-center justify-center shrink-0">
                    16
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink mb-1">
                      Partial or Excessive Action (Optimistic execution,
                      speculative)
                    </p>
                    <p className="text-xs font-light text-text-secondary leading-relaxed">
                      Speculatively start all ensemble members but return the
                      first response that exceeds a confidence threshold,
                      cancelling the rest.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="w-8 h-8 rounded-lg bg-accent-light text-blue-ribbon text-xs font-bold flex items-center justify-center shrink-0">
                    31
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink mb-1">
                      Porous Materials (Probabilistic sketches, sparse
                      structures)
                    </p>
                    <p className="text-xs font-light text-text-secondary leading-relaxed">
                      Use a distilled &ldquo;sketch&rdquo; model that
                      approximates the ensemble output for 90% of inputs, only
                      falling back to the full ensemble for edge cases.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invention */}
            <div className="px-7 py-6 bg-ink">
              <p className="text-[10px] font-medium text-blue-ribbon uppercase tracking-widest mb-3">
                The Invention
              </p>
              <p className="text-sm font-light text-white/70 leading-relaxed">
                The team combined principles 21 and 31: a lightweight routing
                model (trained on the ensemble&rsquo;s own disagreement
                patterns) that predicts input difficulty and routes easy inputs
                to a distilled fast model (&lt;10ms) and hard inputs to the full
                ensemble. The router is retrained weekly using the
                ensemble&rsquo;s confidence distribution as labels.{" "}
                <span className="text-white font-medium">
                  Result: p99 latency dropped from 200ms to 35ms with only 1.2%
                  accuracy degradation on the hardest 5% of inputs.
                </span>
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Principle Highlights ─────────────────────────────────────

function PrincipleHighlights() {
  const highlights = [
    {
      num: 7,
      name: "Nested Doll",
      sw: "Layered caching (L1 in-process, L2 Redis, L3 CDN). Nested containers. Hierarchical config.",
      patentAngle:
        "Multi-tier architectures where each layer adds value are rich patent territory. The novel part is how layers interact.",
    },
    {
      num: 13,
      name: "The Other Way Around",
      sw: "Push instead of pull. Event-driven instead of polling. Invert the dependency.",
      patentAngle:
        "Inverting the conventional approach is one of the strongest signals of non-obviousness in patent examination.",
    },
    {
      num: 15,
      name: "Dynamics",
      sw: "Auto-scaling, adaptive algorithms, dynamic configuration, self-tuning systems.",
      patentAngle:
        "Systems that adapt their own behavior based on runtime signals are highly patentable when the adaptation mechanism is specific.",
    },
    {
      num: 23,
      name: "Feedback",
      sw: "Observability, closed-loop control, adaptive rate limiting, PID controllers for autoscaling.",
      patentAngle:
        "Closed-loop systems that use their own output as input to improve are patent goldmines when the feedback signal is novel.",
    },
    {
      num: 39,
      name: "Inert Atmosphere",
      sw: "Sandboxing, isolation, namespaces, security boundaries, zero-trust networks.",
      patentAngle:
        "Security innovations that create novel isolation boundaries are consistently patentable and defensible.",
    },
    {
      num: 40,
      name: "Composite Materials",
      sw: "Polyglot persistence, hybrid architectures, combining multiple strategies for one goal.",
      patentAngle:
        "Novel combinations of known technologies for a specific purpose. The combination is the invention.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-cotton-field border-y border-border">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-12">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            Patent-Rich Principles
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4">
            Six principles that generate the most patents
          </h2>
          <p className="text-base font-light text-text-secondary max-w-xl mx-auto">
            Based on our analysis of software patent filings, these principles
            appear most frequently in granted patents.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {highlights.map((p, i) => (
            <FadeIn key={p.num} delay={i * 0.08}>
              <div className="bg-white rounded-xl border border-border p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-lg bg-accent-light text-blue-ribbon text-sm font-bold flex items-center justify-center">
                    {p.num}
                  </span>
                  <h3 className="font-medium text-ink">{p.name}</h3>
                </div>
                <p className="text-sm font-light text-text-secondary leading-relaxed mb-4 flex-1">
                  {p.sw}
                </p>
                <div className="bg-cotton-field rounded-lg p-3 border border-border">
                  <p className="text-[10px] font-medium text-blue-ribbon uppercase tracking-wider mb-1">
                    Patent angle
                  </p>
                  <p className="text-xs font-light text-text-secondary leading-relaxed">
                    {p.patentAngle}
                  </p>
                </div>
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
          Go deeper
        </p>
        <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-6 leading-tight">
          Every trade-off is a patent
          <br />
          waiting to be filed.
        </h2>
        <p className="text-base font-light text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          IP Ramp combines the TRIZ matrix with AI-powered ideation, automatic
          Alice scoring, and claim generation. Turn your engineering
          contradictions into defensible IP.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 bg-blue-ribbon text-white text-base font-medium rounded-lg hover:bg-accent-hover transition-colors"
          >
            Get early access
          </Link>
          <Link
            href="/learn/patent-drill-worksheet"
            className="text-sm font-light text-white/60 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Try the Patent Drill Worksheet {"\u2192"}
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
