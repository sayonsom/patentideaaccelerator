import type {
  PromptPreferences,
  Jurisdiction,
  ClaimStyle,
  TechnicalDepth,
  Tone,
  DomainFocus,
} from "./types";

const COMPANY_CONTEXT_MAX_LENGTH = 500;

function sanitizeCompanyContext(raw: string): string {
  let clean = raw.slice(0, COMPANY_CONTEXT_MAX_LENGTH);
  clean = clean
    .replace(/you are now/gi, "")
    .replace(/ignore previous instructions/gi, "")
    .replace(/ignore all previous/gi, "")
    .replace(/system:/gi, "")
    .replace(/\bprompt\b.*\binjection\b/gi, "")
    .replace(/disregard/gi, "")
    .trim();
  return clean;
}

// ─── Jurisdiction ────────────────────────────────────────────────

const JURISDICTION_BLOCKS: Record<Jurisdiction, string> = {
  uspto: `JURISDICTION: United States Patent and Trademark Office (USPTO).
Use U.S. patent law conventions: 35 U.S.C. sections (101, 102, 103, 112), MPEP guidelines, and Federal Circuit case law (Alice Corp. v. CLS Bank, Enfish v. Microsoft, Berkheimer, etc.). Claims should use U.S. claim drafting conventions (comprising, one or more processors, non-transitory CRM). All legal references should cite U.S. statute and case law.`,

  epo: `JURISDICTION: European Patent Office (EPO).
Use EPO conventions: European Patent Convention (EPC) Articles 52-57, EPO Guidelines for Examination, and Boards of Appeal case law. Claims must satisfy the technical effect approach and contribution approach for patentability. Use "characterised in that" in two-part form claims where appropriate. Reference EPC provisions and EPO Board of Appeal decisions. Note that software "as such" exclusions under Art. 52(2)(c) require a demonstrable further technical effect beyond normal physical interactions with hardware.`,

  wipo: `JURISDICTION: World Intellectual Property Organization (WIPO/PCT).
Use PCT international filing conventions. Claims should be drafted to maximize compatibility across major receiving offices (USPTO, EPO, JPO, KIPO, CNIPA). Use broad, internationally acceptable claim language. Reference PCT Rules and international search authority guidelines. Avoid jurisdiction-specific claim formats that may require amendment during national phase entry.`,

  jpo: `JURISDICTION: Japan Patent Office (JPO).
Use JPO examination guidelines for software-related inventions. Japan requires "a creation of technical ideas utilizing a law of nature" (Patent Act Article 2(1)). Claims should demonstrate concrete technical effect. Follow JPO claim structure conventions. Reference JPO Examination Guidelines Part III, Chapter 1. Note that JPO is generally more favorable to software patents than other jurisdictions but requires clear technical contribution.`,
};

// ─── Claim Style ─────────────────────────────────────────────────

const CLAIM_STYLE_BLOCKS: Record<ClaimStyle, string> = {
  broad: `CLAIM STYLE: BROAD — Draft claims at the widest defensible scope. Prioritize portfolio leverage and competitor coverage. Use genus-level language where possible. Independent claims should capture the broadest inventive concept. Include narrow dependent claims as prosecution fallbacks. Accept a higher risk of office actions in exchange for maximum coverage.`,

  narrow: `CLAIM STYLE: NARROW — Draft highly specific, implementation-focused claims. Prioritize fast allowance with minimal office action rounds. Claims should recite concrete implementation details, specific data structures, and particular algorithmic steps. This sacrifices breadth for speed-to-grant and strength against invalidity challenges.`,

  balanced: `CLAIM STYLE: BALANCED — Draft claims at a moderate scope with well-structured fallback positions. Independent claims should be broad enough to catch infringers but specific enough to survive examination without major amendment. Include 3-5 dependent claims per independent claim that progressively narrow scope, creating a claim tree with multiple allowable positions.`,
};

// ─── Technical Depth ─────────────────────────────────────────────

const TECHNICAL_DEPTH_BLOCKS: Record<TechnicalDepth, string> = {
  high: `TECHNICAL DEPTH: HIGH — Write at staff/principal engineer level. Use precise technical terminology for data structures, algorithms, distributed systems concepts, network protocols, and architecture patterns. Assume the reader has deep CS fundamentals and industry experience. Include specific complexity analysis, protocol details, and implementation trade-offs where relevant.`,

  medium: `TECHNICAL DEPTH: MEDIUM — Write at senior engineer level. Use standard industry terminology but explain non-obvious architectural concepts briefly. Balance between precision and accessibility. Avoid overly academic or overly simplified language.`,

  accessible: `TECHNICAL DEPTH: ACCESSIBLE — Write in plain English suitable for engineering managers, legal teams, and non-specialist stakeholders. Minimize jargon. Explain technical concepts in terms of what they accomplish, not how they work internally. Use analogies where helpful. This is a draft for review, not final patent language.`,
};

// ─── Tone ────────────────────────────────────────────────────────

const TONE_BLOCKS: Record<Tone, string> = {
  formal: `TONE: FORMAL PATENT LANGUAGE — Use precise, formal patent prosecution language throughout. "Comprising", "wherein", "configured to", "a plurality of". Avoid colloquialisms. Match the tone and structure of published patent applications.`,

  plain: `TONE: PLAIN ENGLISH DRAFT — Use clear, conversational language. This is an invention disclosure draft, not a final filing. Prioritize clarity and completeness over formal patent phrasing. The patent attorney will convert to formal language later.`,
};

// ─── Domain Focus ────────────────────────────────────────────────

const DOMAIN_FOCUS_BLOCKS: Record<Exclude<DomainFocus, "general">, string> = {
  cloud_infrastructure: `DOMAIN FOCUS: Cloud & Infrastructure — Emphasize cloud-native architectures, containerization, orchestration (Kubernetes), infrastructure-as-code, multi-cloud, serverless, service mesh, load balancing, auto-scaling, CDN, and edge delivery. Reference relevant CPC classes: G06F 9/455 (virtualization), H04L 67/10 (cloud services).`,

  ai_ml: `DOMAIN FOCUS: AI & Machine Learning — Emphasize model training pipelines, inference optimization, feature engineering, neural architecture, transformer models, MLOps, model serving, data labeling, embeddings, retrieval-augmented generation, fine-tuning. Reference CPC classes: G06N (AI/ML), G06F 18/24 (classification).`,

  security: `DOMAIN FOCUS: Security & Privacy — Emphasize authentication, authorization, encryption, zero-trust architecture, identity management, threat detection, secure enclaves, confidential computing, PKI, certificate management, vulnerability scanning, compliance automation. Reference CPC classes: G06F 21/00 (security), H04L 9/00 (cryptography).`,

  iot: `DOMAIN FOCUS: Internet of Things — Emphasize sensor networks, edge processing, device management, firmware OTA updates, constrained devices, MQTT/CoAP protocols, digital twins, predictive maintenance, low-power design. Reference CPC classes: H04W 4/70 (IoT), G05B 19/418.`,

  data_analytics: `DOMAIN FOCUS: Data & Analytics — Emphasize data pipelines, ETL/ELT, stream processing, data warehousing, query optimization, data lakes, real-time analytics, dashboarding, data quality, schema evolution, CDC (change data capture). Reference CPC classes: G06F 16/00 (data management).`,

  fintech: `DOMAIN FOCUS: Fintech & Payments — Emphasize payment processing, fraud detection, real-time risk scoring, regulatory compliance (PCI-DSS, PSD2, SOX), ledger systems, reconciliation, KYC/AML automation, digital wallets, settlement systems. Reference CPC classes: G06Q 20/00 (payments), G06Q 40/00 (finance).`,

  healthcare: `DOMAIN FOCUS: Healthcare & Biotech — Emphasize medical imaging, EHR/EMR integration, clinical decision support, HIPAA compliance, FHIR/HL7 standards, telemedicine, diagnostic algorithms, drug discovery pipelines, patient data privacy. Reference CPC classes: G16H (healthcare informatics), A61B (diagnostics).`,

  blockchain: `DOMAIN FOCUS: Blockchain & Web3 — Emphasize distributed ledger technology, smart contracts, consensus mechanisms, tokenization, decentralized identity, cross-chain bridges, Layer 2 scaling, zero-knowledge proofs, decentralized storage. Reference CPC classes: G06Q 20/00 (payment systems), H04L 9/32 (cryptographic mechanisms).`,

  edge_computing: `DOMAIN FOCUS: Edge Computing — Emphasize edge inference, fog computing, CDN-based computation, low-latency processing, offline-capable systems, mesh networking, real-time video analytics, edge ML, WASM on edge. Reference CPC classes: G06F 9/50 (resource allocation), H04L 67/1097.`,

  devtools: `DOMAIN FOCUS: Developer Tools & DevOps — Emphasize CI/CD, build systems, code analysis, IDE extensions, debugging tools, test frameworks, observability (metrics/logs/traces), deployment automation, infrastructure provisioning, developer experience. Reference CPC classes: G06F 8/00 (software development), G06F 11/36 (testing).`,
};

// ─── Build System Prompt ─────────────────────────────────────────

export function buildSystemPrompt(
  basePrompt: string,
  preferences: PromptPreferences | null | undefined
): string {
  if (!preferences) return basePrompt;

  const sections: string[] = [basePrompt];

  sections.push("\n\n===================================================================");
  sections.push("USER PREFERENCES (apply throughout your response)");
  sections.push("===================================================================\n");

  // Always include jurisdiction — it fundamentally changes legal references
  sections.push(JURISDICTION_BLOCKS[preferences.jurisdiction]);

  // Claim style — skip if balanced (default)
  if (preferences.claimStyle !== "balanced") {
    sections.push("\n" + CLAIM_STYLE_BLOCKS[preferences.claimStyle]);
  }

  // Technical depth
  sections.push("\n" + TECHNICAL_DEPTH_BLOCKS[preferences.technicalDepth]);

  // Tone — skip if formal (default)
  if (preferences.tone !== "formal") {
    sections.push("\n" + TONE_BLOCKS[preferences.tone]);
  }

  // Domain focus — skip if general (no additional context)
  if (preferences.domainFocus !== "general") {
    sections.push("\n" + DOMAIN_FOCUS_BLOCKS[preferences.domainFocus]);
  }

  // Company context — sanitized free-text
  if (preferences.companyContext.trim()) {
    const sanitized = sanitizeCompanyContext(preferences.companyContext);
    if (sanitized) {
      sections.push(`\nCOMPANY CONTEXT: ${sanitized}`);
    }
  }

  return sections.join("\n");
}
