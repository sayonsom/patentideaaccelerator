import type { ChatContext, ChatContextType, SuggestedPrompt } from "./types";

// ─── Context-Aware System Prompts ───────────────────────────────

const BASE_SYSTEM_PROMPT = `You are VoltEdge AI, an expert patent strategy assistant for software engineering teams.

You help engineers strengthen their patent ideas, navigate Alice/Section 101 challenges, identify prior art risks, draft claims, and make strategic IP decisions.

RULES:
- Be specific and technical — reference actual patent concepts, CPC classes, and case law
- When discussing Alice/101, reference the two-step test (abstract idea → inventive concept)
- Suggest concrete improvements, not vague platitudes
- Keep responses focused and actionable
- Use markdown formatting for readability (headers, bullets, bold)
- When asked about claim language, use formal patent drafting conventions`;

function buildIdeaContext(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (data.title) parts.push(`**Title:** ${data.title}`);
  if (data.problemStatement) parts.push(`**Problem:** ${data.problemStatement}`);
  if (data.proposedSolution) parts.push(`**Solution:** ${data.proposedSolution}`);
  if (data.technicalApproach) parts.push(`**Technical Approach:** ${data.technicalApproach}`);
  if (data.contradictionResolved) parts.push(`**Contradiction Resolved:** ${data.contradictionResolved}`);
  if (data.frameworkUsed && data.frameworkUsed !== "none") parts.push(`**Framework:** ${data.frameworkUsed}`);
  if (data.techStack && Array.isArray(data.techStack) && data.techStack.length > 0) {
    parts.push(`**Tech Stack:** ${data.techStack.join(", ")}`);
  }
  if (data.status) parts.push(`**Status:** ${data.status}`);

  // Include scoring if available
  const score = data.score as Record<string, number> | null;
  if (score) {
    parts.push(`**3x3 Score:** Inventive Step: ${score.inventiveStep}/3, Defensibility: ${score.defensibility}/3, Product Fit: ${score.productFit}/3`);
  }

  const alice = data.aliceScore as Record<string, unknown> | null;
  if (alice) {
    parts.push(`**Alice Score:** ${alice.overallScore}/100 (${alice.abstractIdeaRisk} risk)`);
  }

  // Include claims summary if available
  const claims = data.claimDraft as Record<string, string> | null;
  if (claims?.methodClaim) {
    parts.push(`**Method Claim (summary):** ${claims.methodClaim.slice(0, 200)}...`);
  }

  if (data.redTeamNotes) parts.push(`**Red Team Notes:** ${data.redTeamNotes}`);

  return parts.join("\n");
}

function buildPriorArtContext(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (data.query) parts.push(`**Search Query:** ${data.query}`);
  if (data.results && Array.isArray(data.results)) {
    const results = data.results.slice(0, 10);
    parts.push(`**Search Results (${results.length} shown):**`);
    for (const r of results) {
      const patent = r as Record<string, unknown>;
      parts.push(`- ${patent.patentNumber}: ${patent.title}`);
      if (patent.abstract) parts.push(`  Abstract: ${(patent.abstract as string).slice(0, 150)}...`);
    }
  }
  return parts.join("\n");
}

function buildPortfolioContext(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (data.name) parts.push(`**Portfolio:** ${data.name}`);
  if (data.description) parts.push(`**Description:** ${data.description}`);
  if (data.totalEntries) parts.push(`**Total Entries:** ${data.totalEntries}`);
  if (data.ideas && Array.isArray(data.ideas)) {
    const ideas = data.ideas.slice(0, 15);
    parts.push(`**Ideas in portfolio (${ideas.length} shown):**`);
    for (const idea of ideas) {
      const i = idea as Record<string, unknown>;
      parts.push(`- ${i.title || i.externalPatentNo || "Untitled"} (${i.status || "unknown"})`);
    }
  }
  return parts.join("\n");
}

export function buildChatSystemPrompt(context: ChatContext): string {
  const sections: string[] = [BASE_SYSTEM_PROMPT];

  switch (context.type) {
    case "idea":
      sections.push("\n\n--- CURRENT IDEA CONTEXT ---\n");
      sections.push("The user is working on the following patent idea. Use this context to give specific, targeted advice.\n");
      sections.push(buildIdeaContext(context.data));
      break;
    case "prior-art":
      sections.push("\n\n--- PRIOR ART SEARCH CONTEXT ---\n");
      sections.push("The user is reviewing prior art search results. Help them analyze relevance, identify differentiation opportunities, and suggest design-around strategies.\n");
      sections.push(buildPriorArtContext(context.data));
      break;
    case "portfolio":
      sections.push("\n\n--- PORTFOLIO CONTEXT ---\n");
      sections.push("The user is reviewing their patent portfolio. Help with portfolio strategy, whitespace identification, continuation opportunities, and pruning analysis.\n");
      sections.push(buildPortfolioContext(context.data));
      break;
    case "landscaping":
      sections.push("\n\n--- PATENT LANDSCAPE CONTEXT ---\n");
      sections.push("The user is exploring a patent landscape. Help identify key players, technology trends, whitespace opportunities, and strategic positioning.\n");
      if (context.data.techDescription) sections.push(`**Technology Area:** ${context.data.techDescription}`);
      break;
    case "general":
      sections.push("\n\nThe user is asking a general question about patent strategy or IP for software inventions.");
      break;
  }

  return sections.join("\n");
}

// ─── Suggested Prompts ──────────────────────────────────────────

const IDEA_PROMPTS: SuggestedPrompt[] = [
  { label: "Strengthen inventive step", prompt: "How can I strengthen the inventive step in this idea?" },
  { label: "Alice/101 risks", prompt: "What are the main Alice/Section 101 risks in this idea and how can I mitigate them?" },
  { label: "Prior art queries", prompt: "Suggest the best prior art search queries for this idea." },
  { label: "Improve technical approach", prompt: "How can I make the technical approach more specific and patent-worthy?" },
  { label: "Dependent claims", prompt: "What dependent claims could I add to strengthen the claim set?" },
  { label: "Red team this idea", prompt: "Play devil's advocate — what are the strongest arguments against patentability of this idea?" },
];

const PRIOR_ART_PROMPTS: SuggestedPrompt[] = [
  { label: "Differentiation", prompt: "How does my idea differ from these prior art results?" },
  { label: "Most threatening", prompt: "Which of these patents is most threatening to my idea?" },
  { label: "Design around", prompt: "Suggest ways to design around the closest prior art." },
  { label: "Narrow search", prompt: "What more specific search queries should I try?" },
];

const PORTFOLIO_PROMPTS: SuggestedPrompt[] = [
  { label: "Underrepresented areas", prompt: "What technology areas are underrepresented in my portfolio?" },
  { label: "Weakest ideas", prompt: "Which ideas have the weakest patent potential and should be pruned?" },
  { label: "Continuation directions", prompt: "Suggest continuation directions for my strongest patents." },
  { label: "Whitespace opportunities", prompt: "Are there whitespace opportunities given my current portfolio?" },
];

const LANDSCAPING_PROMPTS: SuggestedPrompt[] = [
  { label: "Key players", prompt: "Which companies dominate this technology space?" },
  { label: "Whitespace", prompt: "Where are the biggest whitespace opportunities in this landscape?" },
  { label: "Differentiation", prompt: "How does my idea differentiate from this landscape?" },
  { label: "Filing trends", prompt: "What filing trends do you see over time in this space?" },
];

const GENERAL_PROMPTS: SuggestedPrompt[] = [
  { label: "Alice explained", prompt: "Explain the Alice/Section 101 test for software patents in simple terms." },
  { label: "Strong claims", prompt: "What makes a software patent claim strong and defensible?" },
  { label: "Patent strategy", prompt: "What's the best strategy for building a software patent portfolio from scratch?" },
  { label: "CPC classes", prompt: "What CPC classes are most relevant for software/AI inventions?" },
];

export function getSuggestedPrompts(contextType: ChatContextType): SuggestedPrompt[] {
  switch (contextType) {
    case "idea": return IDEA_PROMPTS;
    case "prior-art": return PRIOR_ART_PROMPTS;
    case "portfolio": return PORTFOLIO_PROMPTS;
    case "landscaping": return LANDSCAPING_PROMPTS;
    case "general": return GENERAL_PROMPTS;
    default: return GENERAL_PROMPTS;
  }
}
