# SIMS — Systematic Innovation Management System

A **100% local** web app for structured patent ideation using TRIZ, SIT, and C-K Theory frameworks.

Built with Next.js. No database. No LLM. No data leaves your machine.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

### Phase 1 — Onboard Innovators
Add team members by **name + email** and tag their interests across 8 engineering categories (60+ tags):
AI & ML, Cloud & Infra, Quantum, Security & Crypto, IoT & Edge, Energy & Power, Data & Analytics, Product & Strategy.

### Phase 2 — Auto-Form Triangles
Teams of ~3 are **automatically formed to maximize interest diversity**. The algorithm:
1. Builds a category-vector per member
2. Greedy seeds each team with the rarest-interest member
3. Fills teams by maximizing Jaccard distance (interest dissimilarity)
4. Runs swap-improvement passes until no swap increases total diversity

You can **click-to-swap** members between teams, **rename** teams, assign a **Data Minister**, and **regenerate** for a fresh arrangement.

### Phase 3 — Idea Workspace
Each triangle gets a full ideation pipeline with:

- **Session Modes**: Quantity (50+ ideas, no criticism) → Quality (3×3 scoring) → Destroy (Red Team attacks)
- **Sprint Phases**: Foundation (20 concepts) → Validation (10 ideas) → Filing (5 patents)
- **72h Team Timer**: Start/pause a 72-hour time budget per team (counts down once started)
- **AI Assist (Optional)**: "Generate with AI" buttons for idea fields + TRIZ/SIT/C-K worksheets (requires OpenAI API key in Settings)
- **Google Patents Search**: One-click patent search shown in a modal (links open in new tabs)
- **TRIZ Worksheet**: Improving/worsening parameters, 40 inventive principles, resolution notes
- **SIT Worksheet**: All 5 templates (Subtraction, Division, Multiplication, Task Unification, Attribute Dependency)
- **C-K Theory Worksheet**: Concept space / Knowledge space mapping, patent opportunity identification
- **3×3 Patent Readiness Matrix**: Inventive Step × Defensibility × Product-Fit scoring
- **Patent Claim Template**: Formal claim drafting with the standard template
- **Red Team Notes**: "This will fail because…" capture
- **Sprint Dashboard**: Pipeline visualization, phase counts, average matrix scores

### Admin View — Progress Dashboard
An in-app admin view to monitor overall progress:
- Total ideas generated + pipeline distribution
- Team stage + 72h timer status
- Contribution counts (ideas created/last edited per person)
- One-click email reminders (opens your default email client via `mailto:`)

### Data Persistence
Export/import JSON files to save and share progress. The JSON includes all members, teams, ideas, scores, and framework notes.

## Project Structure

```
sims-app/
├── app/
│   ├── globals.css       # Dark theme, typography, animations
│   ├── layout.js         # Root layout with metadata
│   └── page.js           # Main orchestrator (3-phase flow)
├── components/
│   ├── ui.js             # Shared UI components
│   ├── MemberSetup.js    # Phase 1: Member onboarding
│   ├── TeamReview.js     # Phase 2: Auto-team review + swap
│   ├── Workspace.js      # Phase 3: Idea pipeline + dashboard
│   └── Frameworks.js     # TRIZ, SIT, C-K, Patent Matrix panels
├── lib/
│   ├── constants.js      # Interest tags, framework data, config
│   └── teamFormation.js  # Diversity-maximizing team algorithm
├── package.json
└── next.config.js
```

## Based On

Systematic Innovation for Patent Generation workshop (TRIZ | SIT | C-K Theory).
