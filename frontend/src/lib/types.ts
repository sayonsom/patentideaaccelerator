// ═══════════════════════════════════════════════════════════════════
// Core Domain Types for VoltEdge
// ═══════════════════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  name: string;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

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

export interface ClaimDraft {
  methodClaim: string;
  systemClaim: string;
  crmClaim: string; // computer-readable medium
  notes: string;
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

export interface Idea {
  id: string;
  userId: string;
  sprintId: string | null;
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
  status: "active" | "paused" | "completed";
  sessionMode: SessionMode;
  phase: SprintPhase;
  timerSecondsRemaining: number;
  timerRunning: boolean;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  technicalApproach: string;
  proposedSolution: string;
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
