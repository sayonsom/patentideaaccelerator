# CLAUDE.md — Patent Idea Accelerator (SaaS)

## Project Overview

**Product Name:** Patent Idea Accelerator (working title — may rebrand)
**Repo:** `patentideaaccelerator` (migrating from JS → TypeScript)
**What it does:** AI-powered patent ideation platform for software/cloud/AI engineering teams. Helps individuals and teams go from "we built something clever" to "here are defensible patent claims."
**Target user:** Software engineers, engineering managers, CTOs at Series B+ startups and tech companies.

## Origin / Existing Codebase

This project extends an existing MVP called **SIMS (Systematic Innovation Management System)** — a 100% local Next.js app for structured patent ideation using TRIZ, SIT, and C-K Theory frameworks.

### Existing file structure (JavaScript — being migrated to TypeScript):
```
sims-app/
├── app/
│   ├── globals.css        # Dark theme, typography, animations
│   ├── layout.js          # Root layout with metadata
│   └── page.js            # Main orchestrator (3-phase flow)
├── components/
│   ├── ui.js              # Shared UI primitives
│   ├── MemberSetup.js     # Phase 1: Member onboarding + interest tagging
│   ├── TeamReview.js      # Phase 2: Auto-team formation + swap UI
│   ├── Workspace.js       # Phase 3: Idea pipeline, sprints, dashboard
│   └── Frameworks.js      # TRIZ, SIT, C-K, Patent Matrix panels
├── lib/
│   ├── constants.js       # Interest tags (60+), framework data, config
│   └── teamFormation.js   # Diversity-maximizing team algorithm (Jaccard)
├── package.json
└── next.config.js
```

### What the existing MVP already does:
- **Phase 1 — Onboard:** Add members by name/email, tag interests across 8 categories (AI/ML, Cloud/Infra, Quantum, Security, IoT, Energy, Data, Product)
- **Phase 2 — Team Formation:** Auto-forms teams of ~3, maximizing interest diversity via Jaccard distance. Click-to-swap, rename, assign Data Minister.
- **Phase 3 — Workspace:** Full ideation pipeline per team:
  - Session modes: Quantity (50+ ideas) → Quality (3×3 scoring) → Destroy (Red Team)
  - Sprint phases: Foundation (20 concepts) → Validation (10 ideas) → Filing (5 patents)
  - 72h team timer
  - TRIZ Worksheet (improving/worsening params, 40 inventive principles)
  - SIT Worksheet (all 5 templates)
  - C-K Theory Worksheet (concept/knowledge space mapping)
  - 3×3 Patent Readiness Matrix (Inventive Step × Defensibility × Product-Fit)
  - Patent Claim Template
  - Red Team Notes
  - Google Patents search in modal
  - Export/Import JSON

### What the existing MVP does NOT do (gaps we are filling):
- No persistent backend (100% localStorage + JSON export)
- No user auth or accounts
- No individual ideation mode (team-only)
- No AI-powered idea generation (optional OpenAI key, not built-in)
- No software-specific inventive principles
- No Alice/Section 101 eligibility scoring
- No prior art search integration (just Google Patents link)
- No codebase/architecture doc ingestion
- No claim language generation

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State:** React hooks + Zustand for global state
- **UI Components:** Custom components (no shadcn — keep lightweight)

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLAlchemy 2.0 + Alembic migrations
- **Database:** PostgreSQL 15+
- **Cache:** Redis (for session data, rate limiting)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Search:** USPTO Open Data API + Google Patents

### Infrastructure
- **Cloud:** AWS
- **Compute:** ECS Fargate (containerized)
- **Database:** RDS PostgreSQL
- **Cache:** ElastiCache Redis
- **Storage:** S3 (document uploads)
- **Auth:** AWS Cognito (or NextAuth.js with Cognito provider)
- **CDN:** CloudFront
- **CI/CD:** GitHub Actions → ECR → ECS
- **Monitoring:** CloudWatch + Sentry

### Containerization
- `Dockerfile.frontend` — Next.js standalone build
- `Dockerfile.backend` — FastAPI with uvicorn
- `docker-compose.yml` — local dev with postgres + redis

---

## New Architecture

```
┌─────────────────────────────────────────────┐
│                  FRONTEND                   │
│            Next.js + TypeScript             │
│                                             │
│  /app                                       │
│    /(auth)/login, signup, forgot-password    │
│    /(dashboard)/                            │
│       /ideas          — individual ideation │
│       /ideas/[id]     — single idea detail  │
│       /sprints        — team sprints        │
│       /sprints/[id]   — sprint workspace    │
│       /frameworks     — TRIZ/SIT/CK tools  │
│       /prior-art      — search interface    │
│       /settings       — account, org, API   │
│    /api/              — Next.js API routes  │
│       /api/auth/[...] — NextAuth handlers   │
└────────────────┬────────────────────────────┘
                 │ HTTPS (JSON)
┌────────────────▼────────────────────────────┐
│                  BACKEND                    │
│              FastAPI (Python)               │
│                                             │
│  /api/v1                                    │
│    /auth         — register, login, tokens  │
│    /users        — profile, preferences     │
│    /ideas        — CRUD, AI generation      │
│    /ideas/{id}/score    — Alice scoring     │
│    /ideas/{id}/prior-art — patent search    │
│    /ideas/{id}/claims   — claim generation  │
│    /sprints      — team sprint management   │
│    /frameworks   — TRIZ/SIT/CK data + AI   │
│    /documents    — upload ADRs, arch docs   │
│    /ai/ideate    — AI ideation endpoint     │
│    /ai/alice-score — 101 eligibility check  │
│    /ai/claim-draft — claim skeleton gen     │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│PostgreSQL│ │  Redis  │ │    S3    │
│ (RDS)  │ │(ElastiC)│ │(uploads) │
└────────┘ └─────────┘ └──────────┘
```

---

## Data Models (PostgreSQL)

### Core Tables

```sql
-- Users
users (
  id UUID PK DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  hashed_password VARCHAR(255),
  cognito_sub VARCHAR(255),          -- AWS Cognito subject ID
  interests JSONB DEFAULT '[]',      -- interest tags array
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Ideas (the central entity)
ideas (
  id UUID PK DEFAULT gen_random_uuid(),
  user_id UUID FK → users NOT NULL,
  sprint_id UUID FK → sprints NULL,  -- null = individual idea
  title VARCHAR(500) NOT NULL,
  problem_statement TEXT,
  proposed_solution TEXT,
  technical_approach TEXT,            -- how it works technically
  contradiction_resolved TEXT,        -- what trade-off it solves
  prior_art_notes TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft|developing|scored|filed|archived
  phase VARCHAR(50) DEFAULT 'foundation', -- foundation|validation|filing
  
  -- Scoring (3×3 matrix)
  score_inventive_step INTEGER CHECK (1-3),
  score_defensibility INTEGER CHECK (1-3),
  score_product_fit INTEGER CHECK (1-3),
  
  -- Alice/101 scoring (AI-generated)
  alice_abstract_idea_risk VARCHAR(20),  -- low|medium|high
  alice_practical_application TEXT,
  alice_inventive_concept TEXT,
  alice_overall_score INTEGER,           -- 0-100
  alice_explanation TEXT,
  
  -- Framework metadata
  framework_used VARCHAR(50),            -- triz|sit|ck|analogy|fmea|none
  framework_data JSONB DEFAULT '{}',     -- framework-specific worksheet data
  
  -- Claim drafts
  claim_method TEXT,
  claim_system TEXT,
  claim_crm TEXT,                        -- computer-readable medium
  
  -- Red team
  red_team_notes TEXT,
  
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Sprints (team-based ideation sessions)
sprints (
  id UUID PK DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID FK → users NOT NULL,
  status VARCHAR(50) DEFAULT 'active',   -- active|paused|completed
  session_mode VARCHAR(50) DEFAULT 'quantity', -- quantity|quality|destroy
  phase VARCHAR(50) DEFAULT 'foundation',
  timer_seconds_remaining INTEGER DEFAULT 259200, -- 72h
  timer_running BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Sprint members
sprint_members (
  sprint_id UUID FK → sprints,
  user_id UUID FK → users,
  role VARCHAR(50) DEFAULT 'member',     -- member|data_minister|lead
  PRIMARY KEY (sprint_id, user_id)
)

-- Prior art search results (cached)
prior_art_results (
  id UUID PK DEFAULT gen_random_uuid(),
  idea_id UUID FK → ideas NOT NULL,
  query_text TEXT NOT NULL,
  results JSONB NOT NULL,                -- array of patent refs
  searched_at TIMESTAMPTZ DEFAULT NOW()
)

-- Document uploads (ADRs, arch docs)
documents (
  id UUID PK DEFAULT gen_random_uuid(),
  user_id UUID FK → users NOT NULL,
  filename VARCHAR(500) NOT NULL,
  s3_key VARCHAR(1000) NOT NULL,
  file_type VARCHAR(50),                 -- adr|architecture|design_doc|other
  extracted_ideas JSONB DEFAULT '[]',    -- AI-extracted patent candidates
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Key Feature Specifications

### 1. Individual Ideation Mode (PRIMARY FLOW)
The main flow for a single user. No team required.

**Flow:**
1. User lands on `/ideas` dashboard — sees all their ideas, sorted by status
2. Click "New Idea" → opens guided creation flow
3. Step 1: Describe the problem you solved (freeform text)
4. Step 2: Choose a framework (optional): TRIZ / SIT / C-K / Analogy / FMEA Inversion / Freeform
5. Step 3: AI assists — generates inventive concepts based on problem + framework
6. Step 4: User refines, adds technical detail
7. Step 5: Alice/101 Pre-Screen — AI scores eligibility, explains risks
8. Step 6: Prior Art Quick Check — searches USPTO/Google Patents
9. Step 7: Generate claim skeleton (method + system + CRM)
10. Idea saved with full worksheet data

**Important:** Each step is optional. User can skip to any step or come back later. Ideas persist in draft state.

### 2. AI Ideation Engine
Uses Claude API to generate inventive concepts.

**Endpoint:** `POST /api/v1/ai/ideate`
**Input:**
```json
{
  "problem_statement": "...",
  "tech_stack": ["distributed systems", "kubernetes", "ML inference"],
  "framework": "triz",  // or "sit", "ck", "analogy", "fmea", "open"
  "existing_approach": "...",  // optional: what they already built
  "num_ideas": 5
}
```
**System prompt should include:**
- Software Inventive Principles (our proprietary list — stored in `/lib/software-principles.ts`)
- Alice/101 awareness — generate ideas that are specific technological improvements, not abstract business methods
- CPC class awareness — tag each idea with likely CPC classification
- Patent language hints — frame ideas in terms of methods, systems, and apparatus

### 3. Alice/Section 101 Pre-Screener
**Endpoint:** `POST /api/v1/ai/alice-score`
**Input:** Idea title + problem + solution + technical approach
**Output:**
```json
{
  "overall_score": 72,
  "abstract_idea_risk": "medium",
  "abstract_idea_analysis": "The claim could be characterized as organizing human activity...",
  "practical_application": "Strong — specifies a novel data pipeline architecture...",
  "inventive_concept": "The specific use of bloom filters for...",
  "recommendations": ["Emphasize the specific hardware-software interaction...", "..."],
  "comparable_cases": ["Enfish v. Microsoft (favorable)", "Alice v. CLS Bank (risk)"]
}
```

### 4. Software Contradiction Matrix
A core differentiator. Stored as structured data in the codebase.

**File:** `lib/software-principles.ts`
**Structure:**
```typescript
export interface SoftwareParameter {
  id: number;
  name: string;
  category: 'performance' | 'scale' | 'reliability' | 'security' | 'product' | 'engineering' | 'operations' | 'ai_ml' | 'data' | 'integration' | 'architecture';
  description: string;
  example_tradeoff: string;
}

export interface SoftwareInventivePrinciple {
  id: number;
  name: string;
  description: string;
  software_examples: string[];
  patent_examples?: string[];  // granted patent numbers that used this principle
}

export interface ContradictionEntry {
  improving_param: number;
  worsening_param: number;
  suggested_principles: number[];  // IDs of inventive principles
}
```

### 5. Prior Art Search
**Endpoint:** `POST /api/v1/ideas/{id}/prior-art`
- Search USPTO Open Data Portal (fulltext search)
- Search Google Patents (via public search URL, parse results)
- Filter by CPC classes relevant to software (G06F, G06N, H04L)
- Cache results in `prior_art_results` table
- Return top 20 most relevant patents with title, abstract, claims summary

### 6. Claim Skeleton Generator
**Endpoint:** `POST /api/v1/ai/claim-draft`
Generates three claim types from a refined idea:
- **Method claim:** "A method for [verb]-ing ... comprising: [step a], [step b]..."
- **System claim:** "A system comprising: a processor; a memory storing instructions; wherein the processor executes..."
- **Computer-readable medium claim:** "A non-transitory computer-readable medium storing instructions that, when executed..."

---

## Frontend Component Architecture

```
src/
├── app/
│   ├── layout.tsx                 # Root layout, providers, auth
│   ├── page.tsx                   # Landing / marketing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Sidebar nav, top bar
│   │   ├── ideas/
│   │   │   ├── page.tsx           # Ideas list + filters
│   │   │   ├── new/page.tsx       # Guided idea creation wizard
│   │   │   └── [id]/page.tsx      # Single idea detail + editing
│   │   ├── sprints/
│   │   │   ├── page.tsx           # Sprint list
│   │   │   └── [id]/page.tsx      # Sprint workspace (ported from Workspace.js)
│   │   ├── frameworks/
│   │   │   └── page.tsx           # TRIZ/SIT/CK interactive tools
│   │   ├── prior-art/
│   │   │   └── page.tsx           # Standalone search interface
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       └── auth/
│           └── [...nextauth]/route.ts
├── components/
│   ├── ui/                        # Primitives: Button, Input, Card, Modal, Badge, etc.
│   ├── ideas/
│   │   ├── IdeaCard.tsx
│   │   ├── IdeaWizard.tsx         # Multi-step creation flow
│   │   ├── IdeaDetail.tsx
│   │   ├── AliceScoreCard.tsx     # 101 eligibility display
│   │   └── ClaimDraft.tsx
│   ├── frameworks/
│   │   ├── TRIZWorksheet.tsx      # Ported from Frameworks.js
│   │   ├── SITWorksheet.tsx
│   │   ├── CKWorksheet.tsx
│   │   ├── ContradictionMatrix.tsx # NEW: Software contradiction matrix
│   │   └── FMEAInversion.tsx       # NEW
│   ├── sprints/
│   │   ├── SprintBoard.tsx
│   │   ├── SprintTimer.tsx
│   │   └── TeamPanel.tsx
│   ├── prior-art/
│   │   ├── SearchForm.tsx
│   │   └── PatentResultCard.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── TopBar.tsx
│       └── CommandPalette.tsx     # Cmd+K quick actions
├── lib/
│   ├── api.ts                    # Typed fetch wrapper for FastAPI
│   ├── auth.ts                   # NextAuth config
│   ├── store.ts                  # Zustand stores
│   ├── software-principles.ts    # Software inventive principles data
│   ├── constants.ts              # Ported from constants.js + extended
│   ├── team-formation.ts         # Ported from teamFormation.js
│   └── types.ts                  # Shared TypeScript interfaces
├── hooks/
│   ├── useIdeas.ts               # React Query hooks for ideas CRUD
│   ├── useSprints.ts
│   ├── useAI.ts                  # Hooks for AI endpoints
│   └── usePriorArt.ts
└── styles/
    └── globals.css
```

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
COGNITO_CLIENT_ID=<aws-cognito-client-id>
COGNITO_CLIENT_SECRET=<aws-cognito-client-secret>
COGNITO_ISSUER=https://cognito-idp.<region>.amazonaws.com/<pool-id>
```

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/patent_ideator
REDIS_URL=redis://localhost:6379/0
ANTHROPIC_API_KEY=<key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=patent-ideator-uploads
COGNITO_USER_POOL_ID=<pool-id>
COGNITO_APP_CLIENT_ID=<client-id>
USPTO_API_KEY=<optional>
CORS_ORIGINS=http://localhost:3000
```

---

## Development Commands

```bash
# Local dev (docker-compose for postgres + redis)
docker-compose up -d db redis

# Frontend
cd frontend
npm install
npm run dev          # localhost:3000

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head  # run migrations
uvicorn app.main:app --reload --port 8000

# Type checking
cd frontend && npx tsc --noEmit

# Full stack local
docker-compose up
```

---

## Coding Conventions

### TypeScript
- Strict mode always
- Prefer `interface` over `type` for object shapes
- Use `zod` for runtime validation of API responses
- No `any` — use `unknown` and narrow
- File naming: `kebab-case.ts` for utils, `PascalCase.tsx` for components

### Python (FastAPI)
- Async everywhere — use `async def` for all endpoints
- Pydantic v2 models for request/response
- Type hints on all functions
- Use `httpx` for external API calls (async)
- Dependency injection for DB sessions, auth, AI client

### CSS / Tailwind
- No custom CSS except `globals.css` base layer
- Use Tailwind utilities exclusively in components
- Color theme uses the custom palette (see below)
- Dark mode support via `dark:` prefix (class strategy)

### Color Theme
```typescript
// Light mode
const light = {
  background: "#FFFFFF",
  panel: "#F5F7FA",
  grid: "#E5E7EB",
  axis: "#D1D5DB",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  series: ["#003A8F","#1F4CEB","#5B7FA6","#2F7F9D","#2E6F4E","#C69214","#7A2E2E","#6B7280"]
};
// Dark mode
const dark = {
  background: "#0B1220",
  panel: "#111827",
  grid: "#1F2933",
  axis: "#374151",
  textPrimary: "#E5E7EB",
  textSecondary: "#9CA3AF",
  series: ["#4F83CC","#1F4CEB","#5B7FA6","#2F7F9D","#4CAF84","#E0B84C","#C26D6D","#9CA3AF"]
};
```

---

## API Design Patterns

All FastAPI endpoints follow this pattern:
```python
@router.post("/ideas", response_model=IdeaResponse, status_code=201)
async def create_idea(
    body: IdeaCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    idea = await idea_service.create(db, user_id=current_user.id, data=body)
    return idea
```

Error responses use RFC 7807 Problem Details:
```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Idea Not Found",
  "status": 404,
  "detail": "No idea with ID abc-123 exists for this user."
}
```

---

## Migration Strategy from Existing MVP

### Phase 1: Port + Persist (Weeks 1-3)
1. Create Next.js project with TypeScript + Tailwind
2. Port `constants.js` → `lib/constants.ts` (add types)
3. Port `teamFormation.js` → `lib/team-formation.ts`
4. Port `Frameworks.js` → split into `TRIZWorksheet.tsx`, `SITWorksheet.tsx`, `CKWorksheet.tsx`
5. Port `Workspace.js` → split into `SprintBoard.tsx`, `SprintTimer.tsx`
6. Port `MemberSetup.js` → becomes part of auth/onboarding flow
7. Stand up FastAPI backend with user + idea + sprint models
8. Replace localStorage/JSON export with API calls

### Phase 2: Individual Mode + AI (Weeks 4-8)
1. Build `IdeaWizard.tsx` — the guided individual ideation flow
2. Implement AI ideation endpoint (Claude API)
3. Implement Alice/101 scoring endpoint
4. Build `ContradictionMatrix.tsx` — interactive software contradiction matrix
5. Build prior art search integration

### Phase 3: Polish + Deploy (Weeks 9-12)
1. Claim skeleton generator
2. Document upload + architecture mining
3. AWS deployment (ECS, RDS, etc.)
4. Auth flow with Cognito
5. Stripe integration for billing (if SaaS launch)

---

## Critical Business Context

- **Buyer:** VP Engineering / CTO who wants patent portfolio as competitive moat
- **Champion:** Staff/principal engineer asked to "come up with patent ideas"
- **Competitor to watch:** IP Copilot (Slack/Jira monitoring, $4.2M seed, Salesforce Ventures)
- **Differentiation:** We are the only tool combining structured inventive frameworks with AI, specifically for software teams. IP Copilot finds needles; we forge new ones.
- **Alice/101 is the #1 reason software patent ideas die.** Building eligibility awareness into the ideation flow (not just the drafting flow) is our key insight.
