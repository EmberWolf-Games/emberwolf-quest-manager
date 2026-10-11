import {
  CHALLENGE_OPTIONS,
  ENCOUNTER_MULTIPLIERS_2014,
  QUEST_POOLS,
  REWARD_ROUNDING_COPPER,
  RULESET_OPTIONS,
  URGENCY_OPTIONS,
  XP_BUDGETS
} from "./quest-pools.mjs";

const MINIMUM_LEVEL = 1;
const MAXIMUM_LEVEL = 20;
const MAXIMUM_BATCH_SIZE = 5;
const COMBAT_CR_BAND = 2;

/**
 * Compose GM-reviewable quest records from one category's compatible pools.
 * Dice expressions are printed as objectives; they are not rolled here.
 */
export async function generateQuests({
  categoryId = "",
  difficultyId = "standard",
  urgencyId = "standard",
  rulesetId = "2024",
  party,
  count = 1
}) {
  const members = normalizeParty(party);
  const partyLevel = Math.floor(members.reduce((sum, member) => sum + member.level, 0) / members.length);
  const quantity = Math.max(1, Math.min(MAXIMUM_BATCH_SIZE, Math.trunc(Number(count) || 1)));
  const difficulty = CHALLENGE_OPTIONS.find(option => option.id === difficultyId);
  const urgency = URGENCY_OPTIONS.find(option => option.id === urgencyId);
  const ruleset = RULESET_OPTIONS.find(option => option.id === rulesetId);
  if (!difficulty) throw new Error("Choose a valid challenge level.");
  if (!urgency) throw new Error("Choose a valid urgency.");
  if (!ruleset) throw new Error("Choose a valid encounter ruleset.");

  const categoryIds = categoryId
    ? [categoryId]
    : Object.keys(QUEST_POOLS);
  if (categoryIds.some(id => !QUEST_POOLS[id])) throw new Error("Choose a valid quest category.");

  const combatTargets = categoryIds.some(id => id === "combat")
    ? await getCombatTargets()
    : [];
  const generated = [];
  const batchTargets = new Set();

  for (let index = 0; index < quantity; index += 1) {
    const candidates = categoryIds.flatMap(id => {
      const pool = QUEST_POOLS[id];
      if (id === "combat") {
        return getCombatCandidates({
          pool,
          combatTargets,
          members,
          partyLevel,
          difficulty,
          rulesetId
        }).map(candidate => ({ ...candidate, categoryId: id, pool }));
      }
      return getNonCombatCandidates({ pool, partyLevel, difficulty })
        .map(candidate => ({ ...candidate, categoryId: id, pool }));
    });

    if (!candidates.length) {
      throw new Error(
        "No feasible options were found for this party and challenge. Try a different category or challenge, or review the category pools."
      );
    }

    const available = candidates.filter(candidate => !batchTargets.has(candidate.categoryId + ":" + candidate.target.id));
    const candidate = chooseWeighted(available.length ? available : candidates, entry => entry.weight);
    batchTargets.add(candidate.categoryId + ":" + candidate.target.id);
    generated.push(buildQuest({
      candidate,
      difficulty,
      urgency,
      ruleset,
      members,
      partyLevel
    }));
  }

  return generated;
}

function normalizeParty(party) {
  const members = (Array.isArray(party) ? party : [])
    .map(member => ({
      id: String(member?.id ?? ""),
      name: String(member?.name ?? "Unnamed character"),
      level: Number(member?.level)
    }))
    .filter(member => Number.isInteger(member.level) && member.level >= MINIMUM_LEVEL && member.level <= MAXIMUM_LEVEL);

  if (!members.length) throw new Error("Select at least one valid player character in the party roster first.");
  return members;
}

async function getCombatTargets() {
  const packId = QUEST_POOLS.combat.targetSource;
  const pack = game.packs.get(packId);
  if (!pack) {
    throw new Error("The dnd5e SRD monster compendium (" + packId + ") is unavailable in this world.");
  }

  const index = await pack.getIndex({ fields: ["system.details.cr", "system.details.xp.value"] });
  const targets = Array.from(index).map(entry => {
    const cr = parseChallengeRating(foundry.utils.getProperty(entry, "system.details.cr"));
    const xpValue = foundry.utils.getProperty(entry, "system.details.xp.value")
      ?? foundry.utils.getProperty(entry, "system.details.xp");
    const xp = Number(typeof xpValue === "object" ? xpValue?.value : xpValue);
    return {
      id: entry._id,
      name: String(entry.name ?? "").trim(),
      cr,
      xp,
      uuid: entry.uuid
    };
  }).filter(target => target.id && target.name && Number.isFinite(target.cr) && Number.isFinite(target.xp) && target.xp > 0);

  if (!targets.length) {
    throw new Error("The dnd5e monster compendium did not provide indexed CR and XP values.");
  }
  return targets;
}

function getCombatCandidates({ pool, combatTargets, members, partyLevel, difficulty, rulesetId }) {
  const bandMinimum = Math.max(0, partyLevel - COMBAT_CR_BAND);
  const bandMaximum = partyLevel + COMBAT_CR_BAND;
  const budget = getPartyXpBudget(members, rulesetId, difficulty);
  const quantities = pool.quantities.filter(option => option.minimumPartyLevel <= partyLevel);
  const candidates = [];

  for (const target of combatTargets) {
    if (target.cr < bandMinimum || target.cr > bandMaximum) continue;
    for (const quantity of quantities) {
      const adjustedXp = estimateEncounterXp(target.xp, quantity.maximum, members.length, rulesetId);
      if (adjustedXp > budget) continue;
      const preferredCr = partyLevel + difficulty.targetOffset;
      const proximity = 1 / (1 + Math.abs(target.cr - preferredCr));
      const budgetUse = budget > 0 ? adjustedXp / budget : 0;
      candidates.push({
        target,
        quantity,
        encounterXp: adjustedXp,
        xpBudget: budget,
        challengeRank: target.cr,
        riskMultiplier: 0.8 + Math.min(1, budgetUse) * 0.4,
        weight: proximity * (0.7 + Math.min(1, budgetUse) * 0.6)
      });
    }
  }
  return candidates;
}

function getNonCombatCandidates({ pool, partyLevel, difficulty }) {
  const minimumRank = Math.max(1, partyLevel - 2);
  const maximumRank = Math.min(MAXIMUM_LEVEL, partyLevel + 2);
  const preferredRank = partyLevel + difficulty.targetOffset;
  const quantities = pool.quantities.filter(option => option.minimumPartyLevel <= partyLevel);
  const candidates = [];

  for (const target of pool.targets ?? []) {
    if (target.challengeRank < minimumRank || target.challengeRank > maximumRank) continue;
    for (const quantity of quantities) {
      const proximity = 1 / (1 + Math.abs(target.challengeRank - preferredRank));
      const rankRisk = Math.max(0.8, Math.min(1.2, 1 + (target.challengeRank - partyLevel) * 0.1));
      candidates.push({
        target,
        quantity,
        encounterXp: null,
        xpBudget: null,
        challengeRank: target.challengeRank,
        riskMultiplier: rankRisk,
        weight: proximity * (0.8 + Math.min(1, quantity.maximum / 8) * 0.2)
      });
    }
  }
  return candidates;
}

function getPartyXpBudget(members, rulesetId, difficulty) {
  const budgetRows = XP_BUDGETS[rulesetId];
  if (!budgetRows) throw new Error("No XP budget data is configured for " + rulesetId + ".");
  const index = rulesetId === "2014" && difficulty.id === "high-risk"
    ? 3
    : difficulty.budgetIndex;
  const budget = members.reduce((sum, member) => sum + Number(budgetRows[member.level]?.[index] ?? 0), 0);
  if (budget <= 0) throw new Error("The selected party levels do not have a configured XP budget.");
  return budget;
}

function parseChallengeRating(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").trim();
  if (/^\d+(\.\d+)?$/.test(normalized)) return Number(normalized);
  const fraction = normalized.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!fraction) return Number.NaN;
  const denominator = Number(fraction[2]);
  return denominator > 0 ? Number(fraction[1]) / denominator : Number.NaN;
}

function estimateEncounterXp(monsterXp, monsterCount, partySize, rulesetId) {
  if (rulesetId !== "2014") return monsterXp * monsterCount;

  let multiplierIndex = monsterCount <= 1 ? 0
    : monsterCount === 2 ? 1
      : monsterCount <= 6 ? 2
        : monsterCount <= 10 ? 3
          : monsterCount <= 14 ? 4
            : 5;
  if (partySize < 3) multiplierIndex = Math.min(5, multiplierIndex + 1);
  else if (partySize >= 6) multiplierIndex = Math.max(0, multiplierIndex - 1);
  return monsterXp * monsterCount * ENCOUNTER_MULTIPLIERS_2014[multiplierIndex];
}

function buildQuest({ candidate, difficulty, urgency, ruleset, members, partyLevel }) {
  const { pool, target, quantity, categoryId } = candidate;
  const action = choose(pool.actions);
  const objective = formatObjective(action, quantity, target);
  const opening = {
    standard: "The guild has posted a routine commission.",
    urgent: "The guild requests swift help; delay may put the objective at risk.",
    emergency: "The guild has declared an immediate crisis, and time is critical."
  }[urgency.id];
  const description = opening + "\n\n" + objective;
  const rewardBand = pool.rewards.find(entry => partyLevel >= entry.minimumPartyLevel && partyLevel <= entry.maximumPartyLevel);
  if (!rewardBand) throw new Error("No provisional reward band is configured for party level " + partyLevel + ".");

  const unroundedReward = rewardBand.baseCopper
    * pool.rewardMultiplier
    * difficulty.rewardMultiplier
    * urgency.rewardMultiplier
    * (target.rewardMultiplier ?? 1)
    * (quantity.rewardMultiplier ?? 1)
    * candidate.riskMultiplier;
  const rewardCopper = Math.max(
    REWARD_ROUNDING_COPPER,
    Math.round(unroundedReward / REWARD_ROUNDING_COPPER) * REWARD_ROUNDING_COPPER
  );
  const categoryLabel = pool.label;
  const gmNotes = [
    "Procedurally generated draft — review the wording, objective, feasibility, and payout before publishing.",
    "Category: " + categoryLabel + "; challenge: " + difficulty.label + "; urgency: " + urgency.label + ".",
    "Party level: " + partyLevel + " (floor of the selected character-level average).",
    "Selected roster: " + members.map(member => member.name + " (level " + member.level + ")").join(", ") + ".",
    categoryId === "combat"
      ? "Combat estimate: CR " + target.cr + ", up to " + quantity.maximum + " creature(s), approximately " + candidate.encounterXp + " adjusted XP against a " + candidate.xpBudget + " XP budget using the " + ruleset.label + ". This is an estimate, not an encounter-safety guarantee."
      : "Noncombat danger rank: " + candidate.challengeRank + " (a configurable comparative rating, not creature CR).",
    "Objective quantity uses " + (quantity.formula || "no dice formula") + "; the formula has not been rolled.",
    "Provisional payout: " + rewardCopper + " CP equivalent. Starter reward values and multipliers are balancing assumptions."
  ].join("\n");

  return {
    title: categoryLabel + " Commission: " + shortTitleTarget(target),
    description,
    gmNotes,
    categoryId,
    categoryLabel,
    urgencyId: urgency.id,
    urgencyLabel: urgency.label,
    rewardCopper,
    generationMetadata: {
      generatorVersion: 1,
      generatedAt: Date.now(),
      categoryId,
      difficultyId: difficulty.id,
      urgencyId: urgency.id,
      rulesetId: ruleset.id,
      partyLevel,
      party: members,
      targetId: target.id,
      targetName: target.name ?? target.subject,
      targetCr: categoryId === "combat" ? target.cr : null,
      challengeRank: candidate.challengeRank,
      quantityId: quantity.id,
      quantityFormula: quantity.formula || "",
      quantityMaximum: quantity.maximum,
      estimatedEncounterXp: candidate.encounterXp,
      estimatedXpBudget: candidate.xpBudget,
      rewardCopper,
      rewardWasRounded: rewardCopper !== unroundedReward
    }
  };
}

function formatObjective(action, quantity, target) {
  if (target.subject && target.destination) {
    return action + " " + target.subject + " to " + target.destination + ".";
  }
  const amount = quantity.formula ? quantity.formula + " " : "";
  const unit = quantity.unit ? quantity.unit + " " : "";
  return action + " " + amount + unit + (target.name ?? "the objective") + ".";
}

function shortTitleTarget(target) {
  return target.name ?? target.subject ?? "New commission";
}

function chooseWeighted(entries, getWeight) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(getWeight(entry)) || 0), 0);
  if (total <= 0) return choose(entries);
  let cursor = Math.random() * total;
  for (const entry of entries) {
    cursor -= Math.max(0, Number(getWeight(entry)) || 0);
    if (cursor <= 0) return entry;
  }
  return entries.at(-1);
}

function choose(entries) {
  return entries[Math.floor(Math.random() * entries.length)];
}
