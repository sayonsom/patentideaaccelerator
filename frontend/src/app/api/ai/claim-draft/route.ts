import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateAIResponse, resolveAIConfig, parseJSONFromResponse, resolvePromptPreferences } from "@/lib/ai-client";
import { buildSystemPrompt } from "@/lib/prompt-preferences";

const SYSTEM_PROMPT = `You are a senior software patent prosecution attorney with 20+ years of experience at a top-tier IP firm. You have personally drafted and prosecuted over 500 software patents through the USPTO, with an allowance rate above 90%. You specialize in cloud computing, AI/ML, distributed systems, and data infrastructure patents.

Your task: draft publication-quality patent claims for a software invention. These claims must maximize scope while surviving Alice/101 scrutiny, anticipate examiner rejections, and create a defensible claim set that is difficult for competitors to design around.

═══════════════════════════════════════════════════════════════
CLAIM DRAFTING PRINCIPLES (apply rigorously)
═══════════════════════════════════════════════════════════════

1. CLAIM STRUCTURE & LANGUAGE:
   - Use "comprising" (open-ended transitional phrase) — never "consisting of"
   - Each method step is a gerund clause ("receiving...", "determining...", "generating...")
   - Use "one or more processors" and "non-transitory computer-readable medium" (not "computer" or "machine")
   - Introduce every element before referencing it — use "a first [element]" on first mention, "the first [element]" thereafter
   - Use precise antecedent basis — every "the" or "said" must trace back to an introduced "a" or "an"
   - Separate each step/element with semicolons, end with a period
   - Avoid naked functional language — tie each function to structure
   - Number claims sequentially (Claim 1, 2, 3...)

2. ALICE/101 SURVIVAL STRATEGY:
   - NEVER frame claims as abstract business methods or organizing human activity
   - Root every claim in specific technical architecture: name data structures, protocols, hardware interactions
   - Include at least one technical transformation or improvement to computer functionality per independent claim
   - Reference specific technical components (buffers, caches, indices, queues, pipelines, models, encoders, hash tables)
   - Frame the invention as improving the functioning of the computer itself, not merely using it as a tool
   - Include technical cause-and-effect: "thereby reducing [specific technical metric]" or "such that [technical improvement]"
   - Cite concrete technical advantages: latency reduction, memory efficiency, throughput improvement, fault tolerance
   - Use the Enfish/Finjan/Core Wireless line of favorable cases as a model — claims should read as improvements to computer technology itself

3. INDEPENDENT CLAIM SCOPE:
   - Draft independent claims at the broadest defensible scope — broad enough to catch infringers, specific enough to survive prosecution
   - Include 4-8 method steps for method claims (not too few = obvious, not too many = easy to design around)
   - System claims should mirror method claims structurally but add hardware recitation (processor, memory, network interface where relevant)
   - CRM claims should track the method claim steps as "instructions that, when executed, cause..."

4. DEPENDENT CLAIMS (CRITICAL):
   - Draft 3-5 dependent claims per independent claim
   - Each dependent narrows one specific aspect: a parameter, a threshold, a data structure, an algorithm, a configuration
   - Dependent claims serve as fallback positions — if the independent claim is rejected, a dependent claim should be allowable
   - Order dependents from narrowest-to-broadest fallback value
   - Include at least one dependent claim that adds a specific performance metric or technical threshold
   - Include at least one dependent claim that specifies a particular implementation detail
   - Include at least one dependent claim that covers an alternative embodiment

5. CLAIM DIFFERENTIATION:
   - Method claim: process steps (what the system does)
   - System claim: structural components (what the system is) — must recite hardware + instructions stored in memory
   - CRM claim: computer-readable medium with stored instructions — tracks method steps
   - All three should cover the same inventive concept from different angles for maximum portfolio coverage

6. PROSECUTION AWARENESS:
   - Anticipate §102 (novelty) rejections: ensure claims recite the specific novel combination, not individual known elements
   - Anticipate §103 (obviousness) rejections: include non-obvious combinations and specify unexpected technical results
   - Anticipate §112 rejections: be specific enough to satisfy written description without limiting scope
   - Use functional language carefully — means-plus-function only when structure is described in the spec
   - Avoid relative terms without a reference point ("substantially", "approximately" need anchoring)

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (strict JSON)
═══════════════════════════════════════════════════════════════

Respond with valid JSON matching this exact structure:

{
  "methodClaim": "<Full independent method claim text starting with '1. A method comprising:' with each step as a separate gerund clause separated by semicolons>",
  "methodDependentClaims": [
    { "claimNumber": 2, "text": "<The method of claim 1, wherein...>" },
    { "claimNumber": 3, "text": "<The method of claim 1, further comprising...>" },
    { "claimNumber": 4, "text": "<The method of claim 2, wherein...>" }
  ],
  "systemClaim": "<Full independent system claim starting with 'N. A system comprising: one or more processors; a memory coupled to the one or more processors and storing instructions that, when executed by the one or more processors, cause the system to:' then mirror method steps>",
  "systemDependentClaims": [
    { "claimNumber": 0, "text": "<The system of claim N, wherein...>" }
  ],
  "crmClaim": "<Full independent CRM claim starting with 'M. A non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause the one or more processors to:' then mirror method steps>",
  "crmDependentClaims": [
    { "claimNumber": 0, "text": "<The non-transitory computer-readable medium of claim M, wherein...>" }
  ],
  "abstractText": "<150-word patent abstract: 'A method, system, and computer-readable medium for [invention]. The method comprises [key steps]. [Key technical advantage].' Must be one paragraph, no claim references.>",
  "claimStrategy": "<2-3 paragraphs explaining: (a) the core inventive concept being claimed, (b) how independent claims are scoped to maximize coverage, (c) how dependent claims create fallback positions for prosecution>",
  "aliceMitigationNotes": "<Specific guidance on how these claims survive Alice analysis. Reference which elements provide the 'something more' under Step 2B. Identify the specific technical improvement to computer functionality.>",
  "prosecutionTips": [
    "<Tip 1: specific amendment or argument to make if examiner applies particular prior art>",
    "<Tip 2: which dependent claim to promote if independent is rejected>",
    "<Tip 3: how to argue non-obviousness based on the specific technical combination>",
    "<Tip 4: any continuation or divisional strategy>"
  ],
  "notes": "<Brief summary of the overall patent strategy in 1-2 sentences>"
}

IMPORTANT:
- Use actual sequential claim numbers (1, 2, 3, ... N, N+1, ... M, M+1)
- Method dependent claimNumbers should be 2, 3, 4, etc. (following claim 1)
- System independent claim should be the next number after last method dependent
- CRM independent claim should be the next number after last system dependent
- Every dependent claim must reference its parent by correct claim number
- Do NOT use placeholder numbers — use real sequential numbers throughout`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let config;
  try {
    config = resolveAIConfig(req);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "API key not configured" },
      { status: 500 }
    );
  }

  const preferences = await resolvePromptPreferences(session.user.id);

  const body = await req.json();
  const {
    title,
    problemStatement,
    existingApproach,
    proposedSolution,
    technicalApproach,
    contradictionResolved,
    techStack,
    frameworkUsed,
    frameworkData,
    aliceScore,
    score,
  } = body;

  if (!title && !technicalApproach) {
    return NextResponse.json(
      { error: "At least title or technicalApproach is required" },
      { status: 400 }
    );
  }

  // Build rich context sections
  const sections: string[] = [];

  sections.push(`# INVENTION DISCLOSURE\n`);
  sections.push(`**Title:** ${title || "Untitled"}`);

  if (problemStatement) {
    sections.push(`\n**Problem Statement:**\n${problemStatement}`);
  }

  if (existingApproach) {
    sections.push(`\n**Existing/Prior Approach (what was done before):**\n${existingApproach}`);
  }

  if (proposedSolution) {
    sections.push(`\n**Proposed Solution:**\n${proposedSolution}`);
  }

  if (technicalApproach) {
    sections.push(`\n**Technical Implementation Details:**\n${technicalApproach}`);
  }

  if (contradictionResolved) {
    sections.push(`\n**Technical Contradiction Resolved:**\n${contradictionResolved}`);
  }

  if (techStack && techStack.length > 0) {
    sections.push(`\n**Technology Domain:** ${techStack.join(", ")}`);
  }

  // Include framework data if available
  if (frameworkUsed && frameworkUsed !== "none") {
    sections.push(`\n**Inventive Framework Used:** ${frameworkUsed.toUpperCase()}`);
    if (frameworkData) {
      if (frameworkData.triz) {
        sections.push(`  - Improving Parameter: ${frameworkData.triz.improving || "—"}`);
        sections.push(`  - Worsening Parameter: ${frameworkData.triz.worsening || "—"}`);
        sections.push(`  - Resolution: ${frameworkData.triz.resolution || "—"}`);
      }
      if (frameworkData.ck) {
        sections.push(`  - Concept Space: ${frameworkData.ck.concepts || "—"}`);
        sections.push(`  - Knowledge Space: ${frameworkData.ck.knowledge || "—"}`);
        sections.push(`  - Opportunity: ${frameworkData.ck.opportunity || "—"}`);
      }
      if (frameworkData.sit) {
        for (const [template, content] of Object.entries(frameworkData.sit)) {
          sections.push(`  - ${template}: ${content || "—"}`);
        }
      }
    }
  }

  // Include Alice score context for claims that proactively mitigate identified risks
  if (aliceScore) {
    sections.push(`\n**Alice/101 Pre-Screen Results:**`);
    sections.push(`  - Overall Score: ${aliceScore.overallScore}/100`);
    sections.push(`  - Abstract Idea Risk: ${aliceScore.abstractIdeaRisk}`);
    if (aliceScore.practicalApplication) {
      sections.push(`  - Practical Application: ${aliceScore.practicalApplication}`);
    }
    if (aliceScore.inventiveConcept) {
      sections.push(`  - Inventive Concept: ${aliceScore.inventiveConcept}`);
    }
    if (aliceScore.recommendations?.length > 0) {
      sections.push(`  - Alice Mitigation Recommendations: ${aliceScore.recommendations.join("; ")}`);
    }
  }

  if (score) {
    sections.push(`\n**Patent Readiness Score:** Inventive Step: ${score.inventiveStep}/3, Defensibility: ${score.defensibility}/3, Product Fit: ${score.productFit}/3`);
  }

  const userPrompt = `${sections.join("\n")}

Draft a complete patent claim set for this software invention. Generate:
- One independent method claim with 3-5 dependent claims
- One independent system claim with 3-5 dependent claims
- One independent CRM claim with 3-5 dependent claims
- A patent abstract (150 words max)
- Claim strategy explanation
- Alice/101 mitigation notes
- Prosecution tips

${aliceScore && aliceScore.abstractIdeaRisk !== "low" ? `\nCRITICAL: The Alice pre-screen flagged "${aliceScore.abstractIdeaRisk}" abstract idea risk. You MUST ensure every independent claim includes specific technical elements that provide the "something more" under Alice Step 2B. Anchor claims in concrete computer architecture, data structures, and measurable technical improvements.` : ""}

Focus on drafting claims that a patent examiner would allow with minimal office action rounds.`;

  try {
    const systemPrompt = buildSystemPrompt(SYSTEM_PROMPT, preferences);
    const { text } = await generateAIResponse(config, systemPrompt, userPrompt, 8192);

    const parsed = parseJSONFromResponse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
