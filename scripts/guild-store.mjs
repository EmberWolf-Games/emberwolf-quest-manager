const MODULE_ID = "emberwolf-quest-manager";
const MEMBER_FLAG = "guildMembership";
const PARTY_NAME_SETTING = "partyName";
const LEGACY_XP_PER_RANK_SETTING = "guildXpPerRank";
const QUEST_XP_AWARD_SETTING = "guildQuestXpAward";
const QUEST_XP_PENALTY_SETTING = "guildQuestXpPenalty";

export const GUILD_RANKS = Object.freeze(["G", "F", "E", "D", "C", "B", "A", "S"]);
const RANK_XP_SETTINGS = Object.freeze([
  { key: "guildXpGtoF", from: "G", to: "F", default: 100 },
  { key: "guildXpFtoE", from: "F", to: "E", default: 150 },
  { key: "guildXpEtoD", from: "E", to: "D", default: 200 },
  { key: "guildXpDtoC", from: "D", to: "C", default: 250 },
  { key: "guildXpCtoB", from: "C", to: "B", default: 300 },
  { key: "guildXpBtoA", from: "B", to: "A", default: 400 },
  { key: "guildXpAtoS", from: "A", to: "S", default: 500 }
]);

export const GUILD_RANK_XP_SETTING_KEYS = Object.freeze(RANK_XP_SETTINGS.map(setting => setting.key));

export const DEFAULT_GUILD_RULES = Object.freeze({
  rankXpCurve: Object.freeze(RANK_XP_SETTINGS.map(setting => setting.default)),
  questXpAward: 25,
  questXpPenalty: 10
});

export function registerGuildSettings() {
  game.settings.register(MODULE_ID, PARTY_NAME_SETTING, {
    name: "Adventuring Party Name",
    hint: "The shared company name displayed on the guild quest board.",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
  game.settings.register(MODULE_ID, LEGACY_XP_PER_RANK_SETTING, {
    name: "Legacy Guild XP Required per Rank",
    hint: "Retained for compatibility with older worlds. Guild ranks now use the configurable progression curve.",
    scope: "world",
    config: false,
    type: Number,
    default: 100
  });
  for (const [index, setting] of RANK_XP_SETTINGS.entries()) {
    game.settings.register(MODULE_ID, setting.key, {
      name: "Guild Rank XP — " + setting.from + " to " + setting.to,
      hint: "Guild XP required to advance from " + setting.from + " to " + setting.to + ". Changing the curve recalculates ranks from each character's saved total Guild XP.",
      scope: "world",
      config: true,
      type: Number,
      range: { min: 1, max: 1000000, step: 1 },
      default: DEFAULT_GUILD_RULES.rankXpCurve[index]
    });
  }
  game.settings.register(MODULE_ID, QUEST_XP_AWARD_SETTING, {
    name: "Guild XP for Completed Quest",
    hint: "Default: +25 Guild XP for each enrolled party character when the GM marks an accepted quest completed. The GM can adjust this on the quest board.",
    scope: "world",
    config: false,
    type: Number,
    default: DEFAULT_GUILD_RULES.questXpAward
  });
  game.settings.register(MODULE_ID, QUEST_XP_PENALTY_SETTING, {
    name: "Guild XP Penalty for Failed Quest",
    hint: "Default: −10 Guild XP for each enrolled party character when the GM marks an accepted quest failed. Guild XP cannot fall below 0; the GM can adjust this on the quest board.",
    scope: "world",
    config: false,
    type: Number,
    default: DEFAULT_GUILD_RULES.questXpPenalty
  });
}

export function getGuildSettings() {
  return {
    partyName: cleanText(game.settings.get(MODULE_ID, PARTY_NAME_SETTING), 80),
    rankXpCurve: RANK_XP_SETTINGS.map((setting, index) =>
      readPositiveSetting(setting.key, DEFAULT_GUILD_RULES.rankXpCurve[index])
    ),
    questXpAward: readPositiveSetting(QUEST_XP_AWARD_SETTING, DEFAULT_GUILD_RULES.questXpAward),
    questXpPenalty: readNonnegativeSetting(QUEST_XP_PENALTY_SETTING, DEFAULT_GUILD_RULES.questXpPenalty)
  };
}

export async function saveGuildSettings(fields) {
  requireGM();
  const settings = {
    partyName: cleanText(fields.partyName, 80),
    questXpAward: parseIntegerSetting(fields.questXpAward, "Guild XP for a completed quest", 1),
    questXpPenalty: parseIntegerSetting(fields.questXpPenalty, "Guild XP penalty for a failed quest", 0)
  };

  await game.settings.set(MODULE_ID, PARTY_NAME_SETTING, settings.partyName);
  await game.settings.set(MODULE_ID, QUEST_XP_AWARD_SETTING, settings.questXpAward);
  await game.settings.set(MODULE_ID, QUEST_XP_PENALTY_SETTING, settings.questXpPenalty);
  return settings;
}

export function getGuildMember(actor) {
  if (actor?.type !== "character") return null;
  const membership = actor.getFlag(MODULE_ID, MEMBER_FLAG);
  if (!membership || typeof membership !== "object" || !membership.joinedAt) return null;
  return foundry.utils.deepClone(membership);
}

export function getCharacterGuildProfile(actor) {
  if (actor?.type !== "character") return emptyProfile();
  const details = actor.system?.details ?? {};
  const classItems = (actor.items?.contents ?? Array.from(actor.items ?? []))
    .filter(item => item.type === "class");
  const classes = classItems.map(item => {
    const name = cleanText(item.name, 80);
    const levels = Number(item.system?.levels);
    const subclassValue = item.system?.subclass;
    const subclassName = typeof subclassValue === "string"
      ? subclassValue
      : cleanText(subclassValue?.name ?? subclassValue?.value, 80);
    const className = subclassName && subclassName.toLowerCase() !== name.toLowerCase()
      ? name + " (" + subclassName + ")"
      : name;
    return classItems.length > 1 && Number.isInteger(levels) && levels > 0
      ? className + " " + levels
      : className;
  }).filter(Boolean);
  const level = getCharacterLevel(actor);

  return {
    name: cleanText(actor.name, 120),
    className: cleanText(classes.join(" / ") || details.originalClass, 120),
    level: level ? String(level) : "",
    age: readText(details.age, 40),
    gender: readText(details.gender, 40),
    race: readRace(actor, details)
  };
}

export async function joinGuild(actor, fields, { gmViewAsPlayer = false } = {}) {
  if (game.user?.isGM && gmViewAsPlayer) {
    if (actor?.type !== "character") throw new Error("Only a character can join the guild.");
  } else {
    requirePlayerOwner(actor);
  }
  if (getGuildMember(actor)) throw new Error("This character already has a guild card.");

  const defaults = getCharacterGuildProfile(actor);
  const profile = {
    name: cleanText(fields.name ?? defaults.name, 120),
    className: cleanText(fields.className ?? defaults.className, 120),
    age: cleanText(fields.age ?? defaults.age, 40),
    gender: cleanText(fields.gender ?? defaults.gender, 40),
    race: cleanText(fields.race ?? defaults.race, 80)
  };
  if (!profile.name) throw new Error("Enter a character name for the guild card.");

  const membership = {
    schemaVersion: 1,
    joinedAt: Date.now(),
    profile,
    guildExperience: 0,
    resolvedQuestIds: [],
    resolvedQuestOutcomes: {}
  };
  await actor.setFlag(MODULE_ID, MEMBER_FLAG, membership);
  return membership;
}

export function getGuildRankProgress(guildExperience, rankXpCurve = getGuildSettings().rankXpCurve) {
  const total = Math.max(0, Math.trunc(Number(guildExperience) || 0));
  const curve = normalizeRankXpCurve(rankXpCurve);
  const thresholds = [0];
  for (const required of curve) thresholds.push(thresholds.at(-1) + required);

  let rankIndex = 0;
  for (let index = 1; index < thresholds.length; index++) {
    if (total < thresholds[index]) break;
    rankIndex = index;
  }
  const rank = GUILD_RANKS[rankIndex];
  const isMaxRank = rankIndex === GUILD_RANKS.length - 1;

  return {
    rank,
    rankIndex,
    isMaxRank,
    current: isMaxRank ? null : total - thresholds[rankIndex],
    required: isMaxRank ? null : curve[rankIndex],
    rankStartExperience: thresholds[rankIndex],
    total
  };
}

export function getGuildRankStartExperience(rank, rankXpCurve = getGuildSettings().rankXpCurve) {
  const rankIndex = GUILD_RANKS.indexOf(String(rank ?? "").trim().toUpperCase());
  if (rankIndex < 0) throw new Error("Choose a valid guild rank from G through S.");
  return normalizeRankXpCurve(rankXpCurve)
    .slice(0, rankIndex)
    .reduce((total, required) => total + required, 0);
}

export async function setGuildRank(actor, rank) {
  requireGM();
  if (actor?.type !== "character") throw new Error("Only a character can have an adventurer guild rank.");

  const profile = getCharacterGuildProfile(actor);
  if (!profile.name) throw new Error("This character needs a name before a guild rank can be assigned.");

  const now = Date.now();
  const membership = getGuildMember(actor) ?? {
    schemaVersion: 1,
    joinedAt: now,
    profile,
    guildExperience: 0,
    resolvedQuestIds: [],
    resolvedQuestOutcomes: {}
  };
  membership.guildExperience = getGuildRankStartExperience(rank);
  membership.updatedAt = now;
  await actor.setFlag(MODULE_ID, MEMBER_FLAG, membership);
  return membership;
}

export async function applyGuildQuestOutcome(actor, questId, outcome) {
  requireGM();
  if (outcome !== "completed" && outcome !== "failed") {
    throw new Error("Choose whether the quest was completed or failed.");
  }

  const membership = getGuildMember(actor);
  if (!membership) return { applied: false, reason: "not-enrolled" };

  const resolvedQuestIds = Array.isArray(membership.resolvedQuestIds) ? membership.resolvedQuestIds : [];
  if (resolvedQuestIds.includes(questId)) {
    const priorOutcome = membership.resolvedQuestOutcomes?.[questId];
    if (priorOutcome && priorOutcome !== outcome) {
      throw new Error("Guild XP for this quest was already resolved with a different outcome.");
    }
    return { applied: false, reason: "already-applied", guildExperience: membership.guildExperience };
  }

  const settings = getGuildSettings();
  const previousExperience = Math.max(0, Math.trunc(Number(membership.guildExperience) || 0));
  const requestedChange = outcome === "completed" ? settings.questXpAward : -settings.questXpPenalty;
  const guildExperience = Math.max(0, previousExperience + requestedChange);
  membership.guildExperience = guildExperience;
  membership.resolvedQuestIds = [...resolvedQuestIds, questId];
  membership.resolvedQuestOutcomes = {
    ...(membership.resolvedQuestOutcomes ?? {}),
    [questId]: outcome
  };
  membership.updatedAt = Date.now();
  await actor.setFlag(MODULE_ID, MEMBER_FLAG, membership);

  return {
    applied: true,
    previousExperience,
    guildExperience,
    change: guildExperience - previousExperience,
    rankBefore: getGuildRankProgress(previousExperience, settings.rankXpCurve).rank,
    rankAfter: getGuildRankProgress(guildExperience, settings.rankXpCurve).rank
  };
}

export function getCharacterLevel(actor) {
  let rollLevel;
  try {
    rollLevel = Number(actor.getRollData?.()?.details?.level);
  } catch (error) {
    console.debug(MODULE_ID + " | Could not read dnd5e roll-data character level for " + actor?.name + ".", error);
  }
  const level = Number.isInteger(rollLevel) && rollLevel > 0
    ? rollLevel
    : Number(actor.system?.details?.level);
  return Number.isInteger(level) && level > 0 ? level : null;
}

function readRace(actor, details) {
  const detailRace = details.race;
  const detailName = typeof detailRace === "string"
    ? detailRace
    : detailRace?.name ?? detailRace?.value;
  const itemRace = (actor.items?.contents ?? Array.from(actor.items ?? []))
    .find(item => ["race", "species"].includes(item.type))?.name;
  return cleanText(detailName || details.species?.name || details.species || itemRace || "", 80);
}

function readText(value, maximumLength) {
  if (typeof value === "string" || typeof value === "number") return cleanText(value, maximumLength);
  return cleanText(value?.name ?? value?.value ?? "", maximumLength);
}

function readPositiveSetting(key, fallback) {
  const value = Number(game.settings.get(MODULE_ID, key));
  return Number.isInteger(value) && value > 0 && value <= 1000000 ? value : fallback;
}

function readNonnegativeSetting(key, fallback) {
  const value = Number(game.settings.get(MODULE_ID, key));
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function parseIntegerSetting(value, label, minimum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > 1000000) {
    throw new Error(label + " must be a whole number from " + minimum + " to 1,000,000.");
  }
  return parsed;
}

function requireGM() {
  if (!game.user?.isGM) throw new Error("Only a Gamemaster can change party settings or award guild experience.");
}

function requirePlayerOwner(actor) {
  if (game.user?.isGM || !game.user || game.user.role >= CONST.USER_ROLES.ASSISTANT) {
    throw new Error("Only a player can join the guild with a character.");
  }
  if (actor?.type !== "character" || !actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
    throw new Error("You must own this player character to join the guild.");
  }
}

function normalizeRankXpCurve(rankXpCurve) {
  const source = Array.isArray(rankXpCurve) ? rankXpCurve : DEFAULT_GUILD_RULES.rankXpCurve;
  return DEFAULT_GUILD_RULES.rankXpCurve.map((fallback, index) => {
    const required = Number(source[index]);
    return Number.isInteger(required) && required > 0 && required <= 1000000 ? required : fallback;
  });
}

function emptyProfile() {
  return { name: "", className: "", level: "", age: "", gender: "", race: "" };
}

function cleanText(value, maximumLength) {
  return String(value ?? "").trim().slice(0, maximumLength);
}

