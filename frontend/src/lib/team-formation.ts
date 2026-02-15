import { INTEREST_CATEGORIES } from "./constants";
import type { Member, Team, TeamFormationResult, TeamFormationStats, TeamCategoryBreakdown, TeamTimer } from "./types";

/**
 * Diversity-maximizing team formation algorithm.
 *
 * Strategy:
 *   1. Build a category-vector for each member (which of the 8 categories they cover).
 *   2. Decide team sizes: prefer 3, remainder distributed to make some teams of 4.
 *   3. Greedy assignment:
 *      a. Seed the first team with the member who covers the RAREST category.
 *      b. For each empty slot, pick the member with LEAST overlap (Jaccard distance).
 *      c. Once a team is full, seed the next team from the remaining pool.
 *   4. Swap-improvement pass until local optimum.
 */

const CATEGORIES = Object.keys(INTEREST_CATEGORIES);

/** Map a member's interest tags to set of category names */
function memberCategories(member: Member): Set<string> {
  const cats = new Set<string>();
  for (const tag of member.interests) {
    for (const [cat, { tags }] of Object.entries(INTEREST_CATEGORIES)) {
      if (tags.includes(tag)) {
        cats.add(cat);
        break;
      }
    }
  }
  return cats;
}

/** Jaccard distance: 1 - |A intersection B| / |A union B| (higher = more diverse) */
function jaccardDistance(setA: Set<string>, setB: Set<string>): number {
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const x of setA) if (setB.has(x)) intersection++;
  return 1 - intersection / union.size;
}

/** Diversity score = distinct categories covered by the team */
function teamDiversityScore(team: Member[]): number {
  const allCats = new Set<string>();
  for (const m of team) {
    for (const c of memberCategories(m)) allCats.add(c);
  }
  return allCats.size;
}

/** Total diversity across all teams */
function totalDiversity(teams: Member[][]): number {
  return teams.reduce((sum, t) => sum + teamDiversityScore(t), 0);
}

const TEAM_NAMES = [
  "Alpha", "Nova", "Helix", "Prism", "Vertex", "Cipher", "Flux",
  "Nexus", "Orbit", "Pulse", "Quark", "Spark", "Tensor", "Vector",
  "Zenith", "Arc", "Bolt", "Core", "Delta", "Echo",
];

function buildTeamObj(members: Member[], index: number): Team {
  const uid = Math.random().toString(36).slice(2, 10);
  const timer: TeamTimer = {
    budgetSeconds: 72 * 60 * 60,
    spentSeconds: 0,
    runningSinceMs: null,
    startedAtMs: null,
    startedStage: null,
  };
  return {
    id: uid,
    name: `\u25B3 ${TEAM_NAMES[index % TEAM_NAMES.length]}`,
    members,
    dataMinister: null,
    ideas: [],
    sessionMode: "quantity",
    sprintPhase: "foundation",
    lastActivityAt: Date.now(),
    timer,
  };
}

function computeStats(rawTeams: Member[][]): TeamFormationStats {
  const scores = rawTeams.map((t) => teamDiversityScore(t));
  const total = scores.reduce((a, b) => a + b, 0);
  const max = rawTeams.length * CATEGORIES.length;
  return {
    teamScores: scores,
    totalDiversity: total,
    maxPossible: max,
    avgDiversity: (total / rawTeams.length).toFixed(1),
    coveragePercent: Math.round((total / max) * 100),
  };
}

/**
 * Main entry: auto-form teams from a list of members.
 */
export function autoFormTeams(members: Member[], preferredSize = 3): TeamFormationResult {
  if (members.length < 3) {
    return {
      teams: [buildTeamObj(members, 0)],
      stats: computeStats([members]),
    };
  }

  const n = members.length;
  const numTeams = Math.max(1, Math.round(n / preferredSize));

  const baseSize = Math.floor(n / numTeams);
  const remainder = n - baseSize * numTeams;
  const teamSizes = Array.from({ length: numTeams }, (_, i) =>
    i < remainder ? baseSize + 1 : baseSize
  );

  // Pre-compute category sets
  const catMap = new Map<string, Set<string>>();
  for (const m of members) catMap.set(m.id, memberCategories(m));

  // Count category rarity
  const catCount: Record<string, number> = {};
  for (const cat of CATEGORIES) catCount[cat] = 0;
  for (const cats of catMap.values()) {
    for (const c of cats) catCount[c]++;
  }

  // Greedy assignment
  const remaining = new Set(members.map((m) => m.id));
  const rawTeams: Member[][] = [];

  for (const size of teamSizes) {
    const team: Member[] = [];

    // Seed: pick member with rarest category
    let seedId: string | null = null;
    let bestRarity = Infinity;
    for (const id of remaining) {
      const cats = catMap.get(id)!;
      let minRarity = Infinity;
      for (const c of cats) minRarity = Math.min(minRarity, catCount[c]);
      const score = minRarity * 100 - cats.size;
      if (score < bestRarity) {
        bestRarity = score;
        seedId = id;
      }
    }

    if (seedId) {
      team.push(members.find((m) => m.id === seedId)!);
      remaining.delete(seedId);
    }

    // Fill remaining slots
    while (team.length < size && remaining.size > 0) {
      const teamCats = new Set<string>();
      for (const m of team) {
        for (const c of catMap.get(m.id)!) teamCats.add(c);
      }

      let bestId: string | null = null;
      let bestDist = -1;
      let bestNewCats = 0;

      for (const id of remaining) {
        const mCats = catMap.get(id)!;
        const dist = jaccardDistance(teamCats, mCats);
        let newCats = 0;
        for (const c of mCats) if (!teamCats.has(c)) newCats++;

        if (
          newCats > bestNewCats ||
          (newCats === bestNewCats && dist > bestDist)
        ) {
          bestDist = dist;
          bestNewCats = newCats;
          bestId = id;
        }
      }

      if (bestId) {
        team.push(members.find((m) => m.id === bestId)!);
        remaining.delete(bestId);
      } else {
        break;
      }
    }

    rawTeams.push(team);
  }

  // Swap-improvement pass
  let improved = true;
  let iterations = 0;
  const maxIterations = n * n;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    const currentScore = totalDiversity(rawTeams);

    for (let ti = 0; ti < rawTeams.length && !improved; ti++) {
      for (let tj = ti + 1; tj < rawTeams.length && !improved; tj++) {
        for (let mi = 0; mi < rawTeams[ti].length && !improved; mi++) {
          for (let mj = 0; mj < rawTeams[tj].length && !improved; mj++) {
            // Try swapping
            const temp = rawTeams[ti][mi];
            rawTeams[ti][mi] = rawTeams[tj][mj];
            rawTeams[tj][mj] = temp;

            const newScore = totalDiversity(rawTeams);
            if (newScore > currentScore) {
              improved = true;
            } else {
              rawTeams[tj][mj] = rawTeams[ti][mi];
              rawTeams[ti][mi] = temp;
            }
          }
        }
      }
    }
  }

  const teams = rawTeams.map((team, i) => buildTeamObj(team, i));
  return { teams, stats: computeStats(rawTeams) };
}

/** Get category breakdown for display */
export function getTeamCategoryBreakdown(team: Team): TeamCategoryBreakdown {
  const catSet = new Set<string>();
  const catDetails: Record<string, { color: string; members: Set<string> }> = {};

  for (const m of team.members) {
    for (const tag of m.interests) {
      for (const [cat, { tags, color }] of Object.entries(INTEREST_CATEGORIES)) {
        if (tags.includes(tag)) {
          catSet.add(cat);
          if (!catDetails[cat]) catDetails[cat] = { color, members: new Set() };
          catDetails[cat].members.add(m.name);
          break;
        }
      }
    }
  }

  return {
    count: catSet.size,
    total: CATEGORIES.length,
    details: Object.entries(catDetails).map(([cat, { color, members }]) => ({
      category: cat,
      color,
      members: [...members],
    })),
    missing: CATEGORIES.filter((c) => !catSet.has(c)),
  };
}
