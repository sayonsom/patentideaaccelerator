import { INTEREST_CATEGORIES } from "./constants";

/**
 * Diversity-maximizing team formation algorithm.
 *
 * Strategy:
 *   1. Build a category-vector for each member (which of the 8 categories they cover).
 *   2. Decide team sizes: prefer 3, remainder distributed to make some teams of 4.
 *   3. Greedy assignment:
 *      a. Seed the first team with the member who covers the RAREST category
 *         (least-represented among all members → ensures niche interests get represented).
 *      b. For each empty slot in that team, pick the remaining member whose
 *         category-set has the LEAST overlap (lowest Jaccard similarity) with the
 *         current team's pooled categories.
 *      c. Once a team is full, seed the next team from the remaining pool.
 *   4. After greedy assignment, run a swap-improvement pass:
 *      For every pair of members in different teams, check if swapping them
 *      increases total diversity score. Accept the best-improving swap. Repeat
 *      until no improving swap exists (local optimum).
 *
 * Diversity score for a team = number of distinct interest CATEGORIES covered
 * (max 8). We maximize the SUM of team diversity scores.
 */

const CATEGORIES = Object.keys(INTEREST_CATEGORIES);

/** Map a member's interest tags → set of category names */
function memberCategories(member) {
  const cats = new Set();
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

/** Jaccard distance: 1 − |A∩B| / |A∪B|  (higher = more diverse) */
function jaccardDistance(setA, setB) {
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const x of setA) if (setB.has(x)) intersection++;
  return 1 - intersection / union.size;
}

/** Diversity score = distinct categories covered by the team's combined interests */
function teamDiversityScore(team) {
  const allCats = new Set();
  for (const m of team) {
    for (const c of memberCategories(m)) allCats.add(c);
  }
  return allCats.size;
}

/** Total diversity across all teams */
function totalDiversity(teams) {
  return teams.reduce((sum, t) => sum + teamDiversityScore(t), 0);
}

/**
 * Main entry: auto-form teams from a list of members.
 * Returns { teams: [{ name, members, ... }], stats: { ... } }
 */
export function autoFormTeams(members, preferredSize = 3) {
  if (members.length < 3) {
    return {
      teams: [buildTeamObj(members, 0)],
      stats: computeStats([members]),
    };
  }

  const n = members.length;
  const numTeams = Math.max(1, Math.round(n / preferredSize));

  // Determine sizes: distribute remainder
  const baseSize = Math.floor(n / numTeams);
  const remainder = n - baseSize * numTeams;
  const teamSizes = Array.from({ length: numTeams }, (_, i) =>
    i < remainder ? baseSize + 1 : baseSize
  );

  // Pre-compute category sets
  const catMap = new Map();
  for (const m of members) catMap.set(m.id, memberCategories(m));

  // Count category rarity (how many members have each category)
  const catCount = {};
  for (const cat of CATEGORIES) catCount[cat] = 0;
  for (const cats of catMap.values()) {
    for (const c of cats) catCount[c]++;
  }

  // ─── Greedy assignment ───────────────────────────────────────
  const remaining = new Set(members.map((m) => m.id));
  const rawTeams = [];

  for (const size of teamSizes) {
    const team = [];

    // Seed: pick member with rarest category (spread niche interests)
    let seedId = null;
    let bestRarity = Infinity;
    for (const id of remaining) {
      const cats = catMap.get(id);
      // Rarity score = minimum catCount among this member's categories
      // (lower = rarer, so we want the member who carries the rarest category)
      let minRarity = Infinity;
      for (const c of cats) minRarity = Math.min(minRarity, catCount[c]);
      // Tie-break: more categories = better seed
      const score = minRarity * 100 - cats.size;
      if (score < bestRarity) {
        bestRarity = score;
        seedId = id;
      }
    }

    if (seedId) {
      team.push(members.find((m) => m.id === seedId));
      remaining.delete(seedId);
    }

    // Fill remaining slots: maximize diversity with current team
    while (team.length < size && remaining.size > 0) {
      const teamCats = new Set();
      for (const m of team) {
        for (const c of catMap.get(m.id)) teamCats.add(c);
      }

      let bestId = null;
      let bestDist = -1;
      let bestNewCats = 0;

      for (const id of remaining) {
        const mCats = catMap.get(id);
        const dist = jaccardDistance(teamCats, mCats);
        // Primary: Jaccard distance (higher = more diverse)
        // Secondary: how many NEW categories this member adds
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
        team.push(members.find((m) => m.id === bestId));
        remaining.delete(bestId);
      } else {
        break;
      }
    }

    rawTeams.push(team);
  }

  // ─── Swap-improvement pass ──────────────────────────────────
  let improved = true;
  let iterations = 0;
  const maxIterations = n * n; // safety cap

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
              improved = true; // keep swap, restart
            } else {
              // revert
              rawTeams[tj][mj] = rawTeams[ti][mi];
              rawTeams[ti][mi] = temp;
            }
          }
        }
      }
    }
  }

  // ─── Build output ───────────────────────────────────────────
  const teams = rawTeams.map((team, i) => buildTeamObj(team, i));
  return { teams, stats: computeStats(rawTeams) };
}

/** Generate team names */
const TEAM_NAMES = [
  "Alpha", "Nova", "Helix", "Prism", "Vertex", "Cipher", "Flux",
  "Nexus", "Orbit", "Pulse", "Quark", "Spark", "Tensor", "Vector",
  "Zenith", "Arc", "Bolt", "Core", "Delta", "Echo",
];

function buildTeamObj(members, index) {
  const uid = Math.random().toString(36).slice(2, 10);
  return {
    id: uid,
    name: `△ ${TEAM_NAMES[index % TEAM_NAMES.length]}`,
    members,
    dataMinister: null,
    ideas: [],
    sessionMode: "quantity",
    sprintPhase: "foundation",
  };
}

function computeStats(rawTeams) {
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

/** Get category breakdown for display */
export function getTeamCategoryBreakdown(team) {
  const catSet = new Set();
  const catDetails = {};
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
