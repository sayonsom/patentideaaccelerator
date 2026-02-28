"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

// ─── Email Capture ────────────────────────────────────────────

function EmailCapture({
  size = "default",
  dark = false,
}: {
  size?: "default" | "large";
  dark?: boolean;
}) {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
    }
  };

  const isLarge = size === "large";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 w-full max-w-lg"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        required
        aria-label="Work email address"
        className={`flex-1 ${isLarge ? "px-5 py-4 text-base" : "px-4 py-3 text-sm"} ${
          dark
            ? "bg-white/10 border-white/20 text-white placeholder:text-white/40"
            : "bg-white border-border text-ink placeholder:text-neutral-light"
        } border rounded-lg focus:ring-2 focus:ring-blue-ribbon focus:border-transparent outline-none`}
      />
      <button
        type="submit"
        className={`${isLarge ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"} bg-blue-ribbon text-white font-medium rounded-lg hover:bg-accent-hover transition-colors whitespace-nowrap`}
      >
        Get early access
      </button>
    </form>
  );
}

// ─── Screenshot Placeholder ───────────────────────────────────

function ScreenshotPlaceholder({
  label,
  description,
  aspect = "video",
}: {
  label: string;
  description?: string;
  aspect?: "video" | "wide" | "square";
}) {
  const aspectClass =
    aspect === "wide"
      ? "aspect-[2/1]"
      : aspect === "square"
        ? "aspect-[4/3]"
        : "aspect-video";

  return (
    <div
      className={`${aspectClass} w-full rounded-lg bg-cotton-field border border-dashed border-neutral-light/60 flex flex-col items-center justify-center gap-2 overflow-hidden relative group`}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #051C2C 1px, transparent 1px), linear-gradient(to bottom, #051C2C 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-neutral-light/70"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>

      <span className="text-[10px] font-medium text-neutral-light/70 uppercase tracking-widest">
        {label}
      </span>

      {description && (
        <span className="text-[10px] font-light text-neutral-light/50 max-w-[80%] text-center leading-relaxed">
          {description}
        </span>
      )}
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <StickyNav />
      <Hero />
      <StatsBar />
      <ProductSuite />
      <AhaMoment />
      <Timeline />
      <ThreeValueProps />
      <ScaleSection />
      <SocialProof />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// ─── Sticky Nav ───────────────────────────────────────────────

function StickyNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-white border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/ipramp_long_logo.png"
            alt="IP Ramp"
            width={384}
            height={216}
            className="h-14 w-auto"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-light">
          <a
            href="#how-it-works"
            className="text-text-secondary hover:text-ink transition-colors"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-text-secondary hover:text-ink transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-text-secondary hover:text-ink transition-colors"
          >
            Pricing
          </a>
          <Link
            href="/learn/patent-drill-worksheet"
            className="text-text-secondary hover:text-ink transition-colors"
          >
            Learn
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-light text-text-secondary hover:text-ink transition-colors hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-blue-ribbon text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
          >
            Get early access
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-20 pb-24 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Social proof badge */}
        <FadeIn className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-accent-light border border-blue-ribbon/10">
            <span className="w-2 h-2 rounded-full bg-blue-ribbon animate-pulse" />
            <span className="text-xs font-light text-text-secondary">
              Engineers at 50+ companies have discovered patents hiding in their
              codebase
            </span>
          </div>
        </FadeIn>

        {/* Headline */}
        <FadeIn className="text-center" delay={0.1}>
          <h1 className="font-serif font-bold text-5xl md:text-6xl lg:text-7xl leading-[1.08] mb-6 text-ink tracking-tight">
            You already invented it.
            <br />
            Now own it.
          </h1>
          <p className="text-lg md:text-xl font-light text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            IP Ramp finds patentable ideas buried in the work your team already
            does&nbsp;&mdash; and turns them into money.
          </p>
        </FadeIn>

        {/* Email capture */}
        <FadeIn className="flex justify-center mb-5" delay={0.2}>
          <EmailCapture size="large" />
        </FadeIn>

        {/* Secondary CTA */}
        <FadeIn className="text-center mb-20" delay={0.25}>
          <a
            href="#how-it-works"
            className="text-sm font-light text-blue-ribbon hover:text-accent-hover transition-colors inline-flex items-center gap-1.5"
          >
            See what you&apos;re missing
            <span className="text-xs">{"\u2193"}</span>
          </a>
        </FadeIn>

        {/* Product Mockup */}
        <FadeIn delay={0.3}>
          <ProductMockup />
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Product Mockup (hero visual) ─────────────────────────────

function ProductMockup() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl border border-border shadow-2xl shadow-ink/5 overflow-hidden bg-white">
        {/* Title bar */}
        <div className="bg-ink px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-xs text-white/40 ml-2 font-light">
            IP Ramp&nbsp;&mdash;&nbsp;Idea Discovery
          </span>
        </div>

        {/* Content */}
        <div className="p-5 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Engineering Input */}
            <div className="rounded-lg bg-cotton-field p-5 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-light/20 text-neutral-light font-medium uppercase tracking-wider">
                  Input
                </span>
                <span className="text-xs text-neutral-light font-light">
                  What your team described
                </span>
              </div>
              <p className="text-sm text-text-secondary font-light leading-relaxed">
                &ldquo;We refactored the distributed cache invalidation to use
                bloom filters across 12 microservices. When any service updates
                a shared entity, the bloom filter propagates the invalidation in
                O(1) instead of our old pub-sub fanout&hellip;&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-light text-blue-ribbon font-medium">
                  Kubernetes
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-light text-blue-ribbon font-medium">
                  Redis
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-light text-blue-ribbon font-medium">
                  Distributed Systems
                </span>
              </div>
            </div>

            {/* Right: Discovery Output */}
            <div className="rounded-lg bg-white p-5 border-2 border-blue-ribbon/20 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-ribbon text-sm">
                    {"\u26A1"}
                  </span>
                  <span className="text-xs font-medium text-blue-ribbon">
                    Patent-worthy insight found
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">
                  Alice: 87
                </span>
              </div>
              <h4 className="text-sm font-medium text-ink mb-2 leading-snug">
                Novel distributed cache invalidation using probabilistic data
                structures
              </h4>
              <p className="text-xs text-text-secondary font-light leading-relaxed mb-3">
                The use of bloom filters for cross-service cache invalidation
                represents a non-obvious optimization over traditional pub-sub
                patterns, achieving constant-time propagation.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-neutral-light font-light">
                <span>CPC: G06F 12/0862</span>
                <span>{"\u00B7"}</span>
                <span>3 claims ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { number: "60K+", label: "Software patents filed yearly in the US" },
    {
      number: "$15-25K",
      label: "Average cost per filing\u2009\u2014\u2009most of it wasted on bad ideas",
    },
    {
      number: "60%+",
      label: "Rejected under Alice because nobody checked first",
    },
    {
      number: "\u221E",
      label: "Patentable ideas your team shipped and never filed",
    },
  ];

  return (
    <section className="py-16 px-6 bg-cotton-field border-y border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-medium text-text-secondary mb-10 tracking-widest uppercase">
          Software teams are sitting on millions in unrecognized IP
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <FadeIn key={stat.number} delay={i * 0.1} className="text-center">
              <div className="text-3xl md:text-4xl font-serif font-bold text-ink mb-2">
                {stat.number}
              </div>
              <p className="text-xs md:text-sm font-light text-text-secondary leading-relaxed">
                {stat.label}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Suite ────────────────────────────────────────────

function ProductSuite() {
  const cards = [
    {
      title: "Idea Discovery",
      oneLiner: "Surface patents hiding in your daily engineering work.",
      description:
        "Describe what your team built. AI identifies the inventive steps you didn\u2019t notice\u2009\u2014\u2009the non-obvious architectural decisions, the clever workarounds, the optimizations that felt routine but aren\u2019t.",
      link: "Learn more",
      screenshotHint: "Engineering description \u2192 patent-worthy output",
    },
    {
      title: "Alice Pre-Screener",
      oneLiner: "Kill bad ideas before they cost you $20K.",
      description:
        "Section 101 eligibility scoring. Every concept scored 0\u2013100 against Alice case law with actionable fixes. Know what\u2019s worth filing before you call a lawyer.",
      link: "Learn more",
      screenshotHint: "Score card with pass/fail + recommendations",
    },
    {
      title: "Contradiction Matrix",
      oneLiner:
        "The trade-offs you fight daily are inventions waiting to happen.",
      description:
        "30 software parameters. 15 inventive principles. Tell IP Ramp what you\u2019re trying to improve and what gets worse\u2009\u2014\u2009it shows you where the patent-worthy solutions live.",
      link: "Try it live",
      screenshotHint: "Latency-vs-consistency trade-off resolved",
    },
    {
      title: "Prior Art Search",
      oneLiner: "What already exists. What doesn\u2019t. What\u2019s yours.",
      description:
        "Automated search across Google Patents filtered by software CPC classes. Results inline with your ideas so you know exactly where the white space is.",
      link: "Learn more",
      screenshotHint: "Search results with gap analysis",
    },
    {
      title: "Claim Generator",
      oneLiner: "Claims your attorney can actually use.",
      description:
        "Auto-drafted method, system, and CRM claims following patent best practices. Export-ready packets that cut attorney time in half.",
      link: "Learn more",
      screenshotHint: "Generated claim skeleton",
    },
    {
      title: "Monetization Signals",
      oneLiner: "Know what your IP is worth before you file.",
      description:
        "See which of your discovered patents map to active licensing markets, competitor portfolios, and M&A signals. File strategically, not randomly.",
      link: "Learn more",
      screenshotHint: "Patent value indicators dashboard",
    },
  ];

  return (
    <section id="features" className="pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-xs font-medium text-blue-ribbon tracking-widest uppercase mb-4">
            IP Ramp Platform
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl text-ink mb-4">
            Find it. Validate it. File it. Monetize it.
          </h2>
          <p className="text-lg font-light text-text-secondary max-w-2xl mx-auto">
            Four steps from &ldquo;I didn&apos;t know that was
            patentable&rdquo; to revenue.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <FadeIn key={card.title} delay={i * 0.08}>
              <div className="group h-full bg-white rounded-xl border border-border overflow-hidden hover:border-blue-ribbon/20 hover:shadow-lg hover:shadow-blue-ribbon/5 transition-all duration-300">
                {/* Screenshot placeholder */}
                <div className="p-3 pb-0">
                  <ScreenshotPlaceholder
                    label="Product screenshot"
                    description={card.screenshotHint}
                  />
                </div>

                {/* Card content */}
                <div className="p-7 pt-5">
                  <p className="text-[10px] font-medium text-blue-ribbon uppercase tracking-widest mb-3">
                    {card.title}
                  </p>
                  <h3 className="font-serif font-bold text-xl text-ink mb-3 leading-snug">
                    {card.oneLiner}
                  </h3>
                  <p className="text-sm font-light text-text-secondary leading-relaxed mb-5">
                    {card.description}
                  </p>
                  <span className="text-sm text-blue-ribbon font-light inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    {card.link}{" "}
                    <span className="text-xs">{"\u2192"}</span>
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Aha Moment ───────────────────────────────────────────────

function AhaMoment() {
  return (
    <section className="py-20 px-6 bg-ink">
      <FadeIn className="max-w-4xl mx-auto text-center">
        <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-8">
          &ldquo;We thought we were just refactoring our caching
          layer.&rdquo;
        </h2>
        <p className="text-lg md:text-xl font-light text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
          That&apos;s what most engineering teams say. The clever workaround
          you shipped on a Friday. The optimization nobody wrote a design doc
          for. The architecture decision that &ldquo;just made
          sense.&rdquo; Those are inventions. You&apos;re leaving them on the
          table.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-blue-ribbon hover:text-dayflower transition-colors font-light text-lg"
        >
          See what IP Ramp finds{" "}
          <span className="text-sm">{"\u2192"}</span>
        </Link>
      </FadeIn>
    </section>
  );
}

// ─── Timeline ─────────────────────────────────────────────────

function Timeline() {
  const steps = [
    {
      label: "Day 1",
      title: "Describe what you built.",
      items: [
        "Paste an architecture decision, a design doc, or just explain what was hard",
        "IP Ramp identifies the inventive steps you didn\u2019t notice",
        "First patentable concepts surface in minutes",
      ],
    },
    {
      label: "Day 3",
      title: "See what\u2019s real.",
      items: [
        "Alice pre-screening scores each concept automatically",
        "Prior art search shows where the white space is",
        "Your team picks the winners",
      ],
    },
    {
      label: "Day 7",
      title: "Wonder why you didn\u2019t start sooner.",
      items: [
        "Claim skeletons ready for patent counsel",
        "Monetization signals show which filings are worth pursuing",
        "One week. Zero wasted attorney hours. IP portfolio started.",
      ],
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-cotton-field">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-4">
          <p className="text-base font-light text-text-secondary mb-4">
            You don&apos;t need a patent strategy. You need five minutes.
          </p>
          <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl text-ink">
            Here&apos;s what IP Ramp surfaces in your first week.
          </h2>
        </FadeIn>

        <FadeIn className="flex justify-center mb-16" delay={0.1}>
          <Link
            href="/signup"
            className="mt-6 px-7 py-3 bg-blue-ribbon text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
          >
            Start discovering
          </Link>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <FadeIn key={step.label} delay={i * 0.15}>
              <div>
                <div className="text-sm font-medium text-blue-ribbon mb-2 tracking-wide">
                  {step.label}
                </div>
                <h3 className="font-serif font-bold text-xl text-ink mb-5">
                  {step.title}
                </h3>
                <ul className="space-y-3.5">
                  {step.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 text-sm font-light text-text-secondary leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-ribbon mt-[7px] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Three Value Props ────────────────────────────────────────

function ThreeValueProps() {
  const props = [
    {
      title: "You\u2019re inventing and not realizing it.",
      body: "Every architectural decision, every clever optimization, every workaround that \u201Cjust worked\u201D\u2009\u2014\u2009some of those are patentable. IP Ramp scans your descriptions and flags what\u2019s novel.",
      link: "Idea Discovery",
      screenshotHint: "Routine engineering input \u2192 patent-worthy output highlighted",
    },
    {
      title: "You\u2019re filing the wrong things.",
      body: "60% of software patents get rejected under Alice because nobody screened them first. IP Ramp scores every idea before you spend a dollar on counsel.",
      link: "Alice Pre-Screener",
      screenshotHint: "High-score vs low-score idea side-by-side",
    },
    {
      title: "You\u2019re filing without knowing what they\u2019re worth.",
      body: "A patent filing costs $15\u201325K. Some are worth millions. Some are worth nothing. IP Ramp shows you the monetization signals before you write the check.",
      link: "Monetization Signals",
      screenshotHint: "Patent value dashboard",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-[2.75rem] text-ink leading-snug mb-2">
                Three* ways your team is
                <br className="hidden md:block" /> leaving money on the table.
              </h2>
              <p className="text-sm font-light text-neutral-light italic">
                *conservatively. We stopped counting after the caching layer
                incident.
              </p>
            </div>
            <a
              href="#pricing"
              className="text-sm text-blue-ribbon hover:text-accent-hover transition-colors font-light whitespace-nowrap inline-flex items-center gap-1"
            >
              See pricing <span className="text-xs">{"\u2192"}</span>
            </a>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {props.map((prop, i) => (
            <FadeIn key={prop.title} delay={i * 0.12}>
              <div>
                {/* Screenshot placeholder */}
                <div className="mb-6">
                  <ScreenshotPlaceholder
                    label="Product screenshot"
                    description={prop.screenshotHint}
                    aspect="square"
                  />
                </div>

                {/* Content */}
                <div className="border-t-2 border-blue-ribbon pt-6">
                  <h3 className="font-serif font-bold text-xl text-ink mb-3 leading-snug">
                    {prop.title}
                  </h3>
                  <p className="text-sm font-light text-text-secondary leading-relaxed mb-5">
                    {prop.body}
                  </p>
                  <span className="text-sm text-blue-ribbon font-light inline-flex items-center gap-1">
                    {prop.link} <span className="text-xs">{"\u2192"}</span>
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Scale Section ────────────────────────────────────────────

function ScaleSection() {
  const features = [
    {
      title: "No patent expertise needed.",
      body: "Describe what you built in plain English. IP Ramp handles the inventive analysis, the legal screening, and the claim drafting.",
    },
    {
      title: "Works with any stack.",
      body: "Distributed systems, ML pipelines, frontend frameworks, infrastructure\u2009\u2014\u2009if your team built it, IP Ramp can analyze it.",
    },
    {
      title: "Attorney-ready exports.",
      body: "Claim skeletons, prior art reports, Alice analysis\u2009\u2014\u2009in formats patent counsel expects. Less back-and-forth. Fewer billable hours.",
    },
    {
      title: "Team sprints built in.",
      body: "72-hour Invention Sprints fit into your existing dev cadence. Discover and validate IP without slowing delivery.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-cotton-field">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink mb-4 max-w-3xl mx-auto leading-snug">
            For the engineer who just shipped something clever. And the CTO who
            wants to own it.
          </h2>
          <p className="text-lg font-light text-text-secondary max-w-2xl mx-auto">
            Simple defaults. Deep customization. IP Ramp works however your
            team works.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.1}>
              <div className="bg-white rounded-xl p-7 border border-border">
                <h3 className="font-medium text-ink mb-2">{f.title}</h3>
                <p className="text-sm font-light text-text-secondary leading-relaxed">
                  {f.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof / Stats ─────────────────────────────────────

function SocialProof() {
  const stats = [
    {
      number: "1,580+",
      label:
        "Google Certified Claims in software per year\u2009\u2014\u2009proof the domain is active",
    },
    {
      number: "~12",
      label:
        "Patentable decisions the average engineering team makes per quarter (and doesn\u2019t file)",
    },
    {
      number: "$1.2M",
      label: "Average value of a software patent in licensing revenue",
    },
    {
      number: "$0",
      label: "What unrecognized IP earns you",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-ink">
            The math on undiscovered IP.
          </h2>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <FadeIn key={stat.number} delay={i * 0.1}>
              <div className="text-center p-6 rounded-xl bg-cotton-field border border-border">
                <div className="text-3xl md:text-4xl font-serif font-bold text-ink mb-3">
                  {stat.number}
                </div>
                <p className="text-xs font-light text-text-secondary leading-relaxed">
                  {stat.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-28 px-6 bg-ink">
      <FadeIn className="max-w-3xl mx-auto text-center">
        <h2 className="font-serif font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-8 leading-tight">
          You already invented it.
          <br />
          Now own it.
        </h2>
        <div className="flex justify-center">
          <EmailCapture size="large" dark />
        </div>
      </FadeIn>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────

function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        "Idea Discovery",
        "Alice Pre-Screener",
        "Contradiction Matrix",
        "Prior Art Search",
        "Claim Generator",
        "Monetization Signals",
        "Invention Sprints",
      ],
    },
    {
      title: "Learn",
      links: [
        { label: "Patent Drill Worksheet", href: "/learn/patent-drill-worksheet" },
        { label: "Software TRIZ Matrix", href: "/learn/software-triz-matrix" },
        { label: "Software Patent Guide", href: "#" },
        { label: "Alice 101 Guide", href: "#" },
      ],
    },
    {
      title: "Company",
      links: ["About", "Pricing", "Careers", "Contact"],
    },
  ];

  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="hidden lg:inline-flex items-center mb-4">
              <Image
                src="/ipramp_long_logo.png"
                alt="IP Ramp"
                width={384}
                height={216}
                className="h-16 w-auto"
              />
            </Link>
            <Link href="/" className="inline-flex lg:hidden items-center gap-2 mb-4">
              <span className="text-blue-ribbon text-xl">{"\u26A1"}</span>
              <span className="font-serif font-bold text-lg text-ink">IP Ramp</span>
            </Link>
            <p className="text-sm font-light text-neutral-light leading-relaxed max-w-xs">
              Discover and monetize the patents hiding in your engineering work.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-medium text-ink mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link: string | { label: string; href: string }) => {
                  const label = typeof link === "string" ? link : link.label;
                  const href = typeof link === "string" ? "#" : link.href;
                  return (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm font-light text-text-secondary hover:text-ink transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <span className="text-xs font-light text-neutral-light">
            &copy; 2026 IP Ramp
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs font-light text-neutral-light hover:text-text-secondary transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-xs font-light text-neutral-light hover:text-text-secondary transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
