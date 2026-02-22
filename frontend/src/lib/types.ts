// ═══════════════════════════════════════════════════════════════════
// Core Domain Types for VoltEdge
// ═══════════════════════════════════════════════════════════════════

export type AccountType = "personal" | "corporate";
export type AIProvider = "anthropic" | "openai" | "google";

export interface User {
  id: string;
  email: string;
  name: string;
  interests: string[];
  accountType: AccountType;
  onboardingComplete: boolean;
  experienceAreas: string[];
  emergingInterests: string[];
  termsAcceptedAt: string | null;
  infraPreferences: InfraPreferences | null;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Organization & RBAC Types
// ═══════════════════════════════════════════════════════════════════

export type OrgRole = "business_admin" | "team_admin" | "member";
export type TeamRole = "admin" | "member";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  orgId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  user?: Pick<User, "id" | "name" | "email">;
}

export interface VoltEdgeTeam {
  id: string;
  name: string;
  orgId: string | null;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberRecord {
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user?: Pick<User, "id" | "name" | "email">;
}

export interface OrgInvite {
  id: string;
  orgId: string;
  email: string | null;
  role: OrgRole;
  code: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string | null;
  role: TeamRole;
  code: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Prompt Preferences (Structured AI Modifiers)
// ═══════════════════════════════════════════════════════════════════

export type Jurisdiction = "uspto" | "epo" | "wipo" | "jpo";
export type ClaimStyle = "broad" | "narrow" | "balanced";
export type TechnicalDepth = "high" | "medium" | "accessible";
export type Tone = "formal" | "plain";
export type DomainFocus =
  | "general"
  | "cloud_infrastructure"
  | "ai_ml"
  | "security"
  | "iot"
  | "data_analytics"
  | "fintech"
  | "healthcare"
  | "blockchain"
  | "edge_computing"
  | "devtools";

export interface PromptPreferences {
  jurisdiction: Jurisdiction;
  claimStyle: ClaimStyle;
  technicalDepth: TechnicalDepth;
  tone: Tone;
  domainFocus: DomainFocus;
  companyContext: string; // max 500 chars
}

// ═══════════════════════════════════════════════════════════════════
// Infrastructure Preferences
// ═══════════════════════════════════════════════════════════════════

export type CloudProvider = "aws" | "azure" | "gcp";
export type DataRegion = "us-east" | "us-west" | "eu-west" | "eu-central" | "ap-southeast" | "ap-northeast";
export type AIDataCenter = "us" | "eu" | "ap";

export interface InfraPreferences {
  cloudProvider: CloudProvider;
  dataRegion: DataRegion;
  aiDataCenter: AIDataCenter;
}

export const DEFAULT_INFRA_PREFERENCES: InfraPreferences = {
  cloudProvider: "aws",
  dataRegion: "us-east",
  aiDataCenter: "us",
};

export const CLOUD_PROVIDER_OPTIONS: { value: CloudProvider; label: string; description: string }[] = [
  { value: "aws", label: "Amazon Web Services", description: "AWS global infrastructure" },
  { value: "azure", label: "Microsoft Azure", description: "Azure cloud platform" },
  { value: "gcp", label: "Google Cloud Platform", description: "GCP infrastructure" },
];

export const DATA_REGION_OPTIONS: { value: DataRegion; label: string }[] = [
  { value: "us-east", label: "US East (Virginia)" },
  { value: "us-west", label: "US West (Oregon)" },
  { value: "eu-west", label: "EU West (Ireland)" },
  { value: "eu-central", label: "EU Central (Frankfurt)" },
  { value: "ap-southeast", label: "Asia Pacific (Singapore)" },
  { value: "ap-northeast", label: "Asia Pacific (Tokyo)" },
];

export const AI_DATA_CENTER_OPTIONS: { value: AIDataCenter; label: string }[] = [
  { value: "us", label: "United States" },
  { value: "eu", label: "European Union" },
  { value: "ap", label: "Asia Pacific" },
];

export const DEFAULT_PROMPT_PREFERENCES: PromptPreferences = {
  jurisdiction: "uspto",
  claimStyle: "balanced",
  technicalDepth: "medium",
  tone: "formal",
  domainFocus: "general",
  companyContext: "",
};

export const JURISDICTION_OPTIONS: { value: Jurisdiction; label: string }[] = [
  { value: "uspto", label: "USPTO (United States)" },
  { value: "epo", label: "EPO (European Patent Office)" },
  { value: "wipo", label: "WIPO (International / PCT)" },
  { value: "jpo", label: "JPO (Japan Patent Office)" },
];

export const CLAIM_STYLE_OPTIONS: { value: ClaimStyle; label: string; description: string }[] = [
  { value: "broad", label: "Broad", description: "Maximize claim scope for portfolio leverage" },
  { value: "balanced", label: "Balanced", description: "Defensible scope with fallback positions" },
  { value: "narrow", label: "Narrow", description: "Highly specific claims for faster allowance" },
];

export const TECHNICAL_DEPTH_OPTIONS: { value: TechnicalDepth; label: string; description: string }[] = [
  { value: "high", label: "High", description: "Staff/principal engineer level" },
  { value: "medium", label: "Medium", description: "Senior engineer level" },
  { value: "accessible", label: "Accessible", description: "Plain English for non-technical stakeholders" },
];

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "formal", label: "Formal Patent Language" },
  { value: "plain", label: "Plain English Draft" },
];

export const DOMAIN_FOCUS_OPTIONS: { value: DomainFocus; label: string }[] = [
  { value: "general", label: "General Software" },
  { value: "cloud_infrastructure", label: "Cloud & Infrastructure" },
  { value: "ai_ml", label: "AI & Machine Learning" },
  { value: "security", label: "Security & Privacy" },
  { value: "iot", label: "Internet of Things" },
  { value: "data_analytics", label: "Data & Analytics" },
  { value: "fintech", label: "Fintech & Payments" },
  { value: "healthcare", label: "Healthcare & Biotech" },
  { value: "blockchain", label: "Blockchain & Web3" },
  { value: "edge_computing", label: "Edge Computing" },
  { value: "devtools", label: "Developer Tools & DevOps" },
];

// ═══════════════════════════════════════════════════════════════════
// Idea & Pipeline Types
// ═══════════════════════════════════════════════════════════════════

export type IdeaStatus = "draft" | "developing" | "scored" | "filed" | "archived";
export type IdeaPhase = "foundation" | "validation" | "filing";
export type FrameworkType = "triz" | "sit" | "ck" | "analogy" | "fmea" | "none";
export type SessionMode = "quantity" | "quality" | "destroy";
export type SprintPhase = "foundation" | "validation" | "filing";
export type AliceRiskLevel = "low" | "medium" | "high";

export interface IdeaScore {
  inventiveStep: number; // 1-3
  defensibility: number; // 1-3
  productFit: number;    // 1-3
}

export interface AliceScore {
  overallScore: number;          // 0-100
  abstractIdeaRisk: AliceRiskLevel;
  abstractIdeaAnalysis: string;
  practicalApplication: string;
  inventiveConcept: string;
  recommendations: string[];
  comparableCases: string[];
}

export interface ClaimDependentClaim {
  claimNumber: number;
  text: string;
}

export interface ClaimSet {
  independentClaim: string;
  dependentClaims: ClaimDependentClaim[];
}

export interface ClaimDraft {
  methodClaim: string;
  systemClaim: string;
  crmClaim: string; // computer-readable medium
  methodDependentClaims: ClaimDependentClaim[];
  systemDependentClaims: ClaimDependentClaim[];
  crmDependentClaims: ClaimDependentClaim[];
  abstractText: string;
  claimStrategy: string;
  aliceMitigationNotes: string;
  prosecutionTips: string[];
  notes: string;
}

// ═══════════════════════════════════════════════════════════════════
// Patent Filing Analysis Types
// ═══════════════════════════════════════════════════════════════════

export interface InventiveStepAnalysis {
  primaryInventiveStep: string;
  secondarySteps: string[];
  nonObviousnessArgument: string;
  closestPriorArt: string[];
  differentiatingFactors: string[];
  technicalAdvantage: string;
}

export interface MarketNeedsAnalysis {
  marketSize: string;
  targetSegments: string[];
  painPointsSolved: string[];
  competitiveLandscape: string;
  commercializationPotential: string;
  licensingOpportunities: string[];
  strategicValue: string;
}

export interface PatentReport {
  executiveSummary: string;
  inventiveStepAnalysis: InventiveStepAnalysis;
  marketNeedsAnalysis: MarketNeedsAnalysis;
  claimStrategy: string;
  filingRecommendation: string;
  riskAssessment: string;
  nextSteps: string[];
}

export interface TRIZData {
  improving: string;
  worsening: string;
  principles: number[];
  resolution: string;
}

export interface SITData {
  [templateId: string]: string;
}

export interface CKData {
  concepts: string;
  knowledge: string;
  opportunity: string;
}

export interface FMEAEntry {
  id: string;
  failureMode: string;
  effect: string;
  severity: number; // 1-10
  novelMitigation: string;
  patentCandidate: boolean;
}

export type FrameworkData = {
  triz?: TRIZData;
  sit?: SITData;
  ck?: CKData;
  fmea?: FMEAEntry[];
};

// ═══════════════════════════════════════════════════════════════════
// AI Framework Coach Types
// ═══════════════════════════════════════════════════════════════════

export type CoachableFramework = "triz" | "sit" | "ck" | "fmea" | "matrix";

export interface CoachingRequest {
  framework: CoachableFramework;
  worksheetState: Record<string, unknown>;
  focusArea?: string;
  previousCoaching?: string | null;
}

export interface CoachingResponse {
  questions: string[];
  suggestions: string[];
  angles: string[];
  frameworkTip: string;
}

export interface Idea {
  id: string;
  userId: string;
  sprintId: string | null;
  teamId: string | null;
  title: string;
  problemStatement: string;
  existingApproach: string;
  proposedSolution: string;
  technicalApproach: string;
  contradictionResolved: string;
  priorArtNotes: string;
  status: IdeaStatus;
  phase: IdeaPhase;
  techStack: string[];
  tags: string[];

  // Scoring (3x3 matrix)
  score: IdeaScore | null;

  // Alice/101 scoring
  aliceScore: AliceScore | null;

  // Framework
  frameworkUsed: FrameworkType;
  frameworkData: FrameworkData;

  // Claims
  claimDraft: ClaimDraft | null;

  // Patent filing analyses
  inventiveStepAnalysis: InventiveStepAnalysis | null;
  marketNeedsAnalysis: MarketNeedsAnalysis | null;
  patentReport: PatentReport | null;

  // Red team
  redTeamNotes: string;

  // Business alignment
  alignmentScores: AlignmentScore[];

  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Business Alignment Types
// ═══════════════════════════════════════════════════════════════════

export interface BusinessGoal {
  id: string;
  userId: string;
  orgId: string | null;
  title: string;
  description: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlignmentScore {
  id: string;
  ideaId: string;
  goalId: string;
  score: number;    // 0-10
  rationale: string;
}

// ═══════════════════════════════════════════════════════════════════
// Red Team Result
// ═══════════════════════════════════════════════════════════════════

export interface RedTeamResult {
  critique: string;
  weaknesses: string[];
  priorArtConcerns: string[];
  aliceRisks: string[];
  recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Sprint / Team Types
// ═══════════════════════════════════════════════════════════════════

export type MemberRole = "member" | "data_minister" | "lead";

export interface Member {
  id: string;
  name: string;
  email: string;
  interests: string[];
}

export interface TeamTimer {
  budgetSeconds: number;
  spentSeconds: number;
  runningSinceMs: number | null;
  startedAtMs: number | null;
  startedStage: string | null;
}

export interface Team {
  id: string;
  name: string;
  members: Member[];
  dataMinister: string | null; // member ID
  ideas: Idea[];
  sessionMode: SessionMode;
  sprintPhase: SprintPhase;
  lastActivityAt: number;
  timer: TeamTimer;
}

export interface Sprint {
  id: string;
  name: string;
  ownerId: string;
  teamId: string | null;
  description: string;
  theme: string;
  status: "active" | "paused" | "completed";
  sessionMode: SessionMode;
  phase: SprintPhase;
  timerSecondsRemaining: number;
  timerRunning: boolean;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SprintMemberRecord {
  sprintId: string;
  userId: string;
  role: string;
  user?: Pick<User, "id" | "name" | "email">;
}

// ═══════════════════════════════════════════════════════════════════
// Software Principles Types
// ═══════════════════════════════════════════════════════════════════

export type ParameterCategory =
  | "performance"
  | "scale"
  | "reliability"
  | "security"
  | "product"
  | "engineering"
  | "operations"
  | "ai_ml"
  | "data"
  | "integration"
  | "architecture";

export interface SoftwareParameter {
  id: number;
  name: string;
  category: ParameterCategory;
  description: string;
  exampleTradeoff: string;
}

export interface SoftwareInventivePrinciple {
  id: number;
  name: string;
  description: string;
  softwareExamples: string[];
  patentExamples?: string[];
}

export interface ContradictionEntry {
  improvingParam: number;
  worseningParam: number;
  suggestedPrinciples: number[];
}

// ═══════════════════════════════════════════════════════════════════
// Patent / Prior Art Types
// ═══════════════════════════════════════════════════════════════════

export interface PatentResult {
  patentNumber: string;
  title: string;
  abstract: string;
  filingDate: string | null;
  grantDate: string | null;
  cpcClasses: string[];
  relevanceNote: string;
  url: string;
}

export interface PriorArtSearch {
  id: string;
  ideaId: string;
  queryText: string;
  results: PatentResult[];
  searchedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Constants Types (for framework/UI data)
// ═══════════════════════════════════════════════════════════════════

export interface InterestCategory {
  color: string;
  tags: string[];
}

export interface InterestTag {
  tag: string;
  category: string;
  color: string;
}

export interface TRIZPrinciple {
  id: number;
  name: string;
  hint: string;
}

export interface SITTemplate {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  example: string;
}

export interface CKPrompts {
  concept: string;
  knowledge: string;
  expansion: string;
}

export interface SprintPhaseConfig {
  key: SprintPhase;
  label: string;
  weeks: string;
  target: string;
  targetCount: number;
  color: string;
  icon: string;
}

export interface PatentMatrixDimension {
  key: keyof IdeaScore;
  label: string;
  icon: string;
  levels: {
    score: number;
    label: string;
    desc: string;
  }[];
}

export interface SessionModeConfig {
  key: SessionMode;
  label: string;
  icon: string;
  color: string;
  rules: string[];
  target: string;
}

// ═══════════════════════════════════════════════════════════════════
// AI Request/Response Types
// ═══════════════════════════════════════════════════════════════════

export interface IdeateRequest {
  problemStatement: string;
  techStack: string[];
  framework: FrameworkType | "open";
  existingApproach?: string;
  numIdeas: number;
}

export interface GeneratedIdea {
  title: string;
  problemReframed: string;
  proposedSolution: string;
  technicalApproach: string;
  contradictionResolved: string | null;
  inventivePrincipleUsed: string | null;
  estimatedCpcClass: string | null;
  aliceRiskHint: AliceRiskLevel;
}

export interface IdeateResponse {
  ideas: GeneratedIdea[];
  frameworkUsed: string;
}

export interface AliceScoreRequest {
  title: string;
  problemStatement: string;
  proposedSolution: string;
  technicalApproach: string;
}

export interface ClaimDraftRequest {
  title: string;
  problemStatement: string;
  existingApproach: string;
  proposedSolution: string;
  technicalApproach: string;
  contradictionResolved: string;
  techStack: string[];
  frameworkUsed: string;
  frameworkData: FrameworkData;
  aliceScore: AliceScore | null;
  score: IdeaScore | null;
}

// ═══════════════════════════════════════════════════════════════════
// Team Formation Types
// ═══════════════════════════════════════════════════════════════════

export interface TeamFormationResult {
  teams: Team[];
  stats: TeamFormationStats;
}

export interface TeamFormationStats {
  teamScores: number[];
  totalDiversity: number;
  maxPossible: number;
  avgDiversity: string;
  coveragePercent: number;
}

export interface TeamCategoryBreakdown {
  count: number;
  total: number;
  details: {
    category: string;
    color: string;
    members: string[];
  }[];
  missing: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Chat-with-Context Types (Appendix A.2)
// ═══════════════════════════════════════════════════════════════════

export type ChatContextType = "idea" | "portfolio" | "prior-art" | "landscaping" | "general";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatHistory {
  id: string;
  userId: string;
  contextType: ChatContextType;
  contextId: string | null;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatContext {
  type: ChatContextType;
  id: string | null;
  label: string;
  data: Record<string, unknown>;
}

export interface SuggestedPrompt {
  label: string;
  prompt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Portfolio Types (Appendix A.1)
// ═══════════════════════════════════════════════════════════════════

export type PortfolioIdeaStatus = "pending" | "filed" | "granted" | "abandoned";

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ideas?: PortfolioIdea[];
}

export interface PortfolioIdea {
  id: string;
  portfolioId: string;
  ideaId: string | null;
  externalPatentNo: string | null;
  externalTitle: string | null;
  filingDate: string | null;
  grantDate: string | null;
  status: PortfolioIdeaStatus;
  notes: string;
  cpcClasses: string[];
  createdAt: string;
  updatedAt: string;
  idea?: Idea | null;
}

export interface PortfolioSummaryStats {
  totalEntries: number;
  byStatus: Record<PortfolioIdeaStatus, number>;
  byCpc: Record<string, number>;
  filedThisYear: number;
  grantedThisYear: number;
}

// ═══════════════════════════════════════════════════════════════════
// Patent Landscaping Types (Appendix A.3)
// ═══════════════════════════════════════════════════════════════════

export type LandscapingStatus = "draft" | "taxonomy_ready" | "searching" | "complete";

export interface TaxonomyCategory {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  cpcClasses: string[];
}

export interface LandscapingTaxonomy {
  categories: TaxonomyCategory[];
  generatedAt: string;
}

export interface LandscapingSession {
  id: string;
  userId: string;
  name: string;
  techDescription: string;
  taxonomy: LandscapingTaxonomy | null;
  status: LandscapingStatus;
  patents?: LandscapingPatent[];
  createdAt: string;
  updatedAt: string;
}

export interface LandscapingPatent {
  id: string;
  sessionId: string;
  patentNumber: string;
  title: string;
  abstract: string;
  filingDate: string | null;
  cpcClasses: string[];
  taxonomyBucket: string;
  relevanceScore: number;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Continuation Assistant Types (Appendix A.5)
// ═══════════════════════════════════════════════════════════════════

export type ContinuationDirection = "continuation-in-part" | "divisional" | "design-around" | "improvement";

export interface ContinuationResult {
  id: string;
  ideaId: string;
  directionType: ContinuationDirection;
  title: string;
  description: string;
  technicalDelta: string;
  promotedIdeaId: string | null;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Magic Columns Types (Appendix A.4)
// ═══════════════════════════════════════════════════════════════════

export interface MagicColumn {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  isPreset: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type MagicColumnValueStatus = "pending" | "computing" | "done" | "error";

export interface MagicColumnValue {
  id: string;
  columnId: string;
  ideaId: string;
  value: string;
  status: MagicColumnValueStatus;
  computedAt: string | null;
}

export const MAGIC_COLUMN_PRESETS = [
  { name: "Licensing Potential", prompt: "Rate the licensing potential of this patent idea on a scale of 1-5. Consider: market size, number of potential licensees, enforceability, and revenue potential. Respond with just the rating number and a one-sentence explanation." },
  { name: "Competitive Moat", prompt: "Assess the competitive moat strength of this patent idea on a scale of 1-5. Consider: how easy it would be for competitors to design around, breadth of coverage, and strategic value. Respond with just the rating number and a one-sentence explanation." },
  { name: "Implementation Complexity", prompt: "Rate the implementation complexity of this patent idea on a scale of 1-5 (1=simple, 5=very complex). Consider: engineering effort, infrastructure requirements, and technical dependencies. Respond with just the rating number and a one-sentence explanation." },
] as const;
