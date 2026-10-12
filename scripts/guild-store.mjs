const MODULE_ID = "emberwolf-quest-manager";
const MEMBER_FLAG = "guildMembership";
const PARTY_NAME_SETTING = "partyName";
const XP_PER_RANK_SETTING = "guildXpPerRank";
const QUEST_XP_AWARD_SETTING = "guildQuestXpAward";
const QUEST_XP_PENALTY_SETTING = "guildQuestXpPenalty";

export const GUILD_RANKS = Object.freeze(["G", "F", "E", "D", "C", "B", "A", "S"]);

export const DEFAULT_GUILD_RULES = Object.freeze({
  xpPerRank: 100,
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
  game.settings.register(MODULE_ID, XP_PER_RANK_SETTING, {
    name: "Guild XP Required per Rank",
    hint: "Provisional number of guild experience points needed to advance one rank.",
    scope: "world",
    config: false,
    type: Number,
    default: DEFAULT_GUILD_RULES.xpPerRank
  });
  game.settings.register(MODULE_ID, QUEST_XP_AWARD_SETTING, {
    name: "Guild XP for Completed Quest",
    hint: "Provisional guild experience awarded to each enrolled party character when a quest is completed.",
    scope: "world",
    config: false,
    type: Number,
    default: DEFAULT_GUILD_RULES.questXpAward
  });
  game.settings.register(MODULE_ID, QUEST_XP_PENALTY_SETTING, {
    name: "Guild XP Penalty for Failed Quest",
    hint: "Provisional guild experience deducted from each enrolled party character when a quest fails.",
    scope: "world",
    config: false,
    type: Number,
    default: DEFAULT_GUILD_RULES.questXpPenalty
  });
}

export function getGuildSettings() {
  return {
    partyName: cleanText(game.settings.get(MODULE_ID, PARTY_NAME_SETTING), 80),
    xpPerRank: readPositiveSetting(XP_PER_RANK_SETTING, DEFAULT_GUILD_RULES.xpPerRank),
    questXpAward: readPositiveSetting(QUEST_XP_AWARD_SETTING, DEFAULT_GUILD_RULES.questXpAward),
    questXpPenalty: readNonnegativeSetting(QUEST_XP_PENALTY_SETTING, DEFAULT_GUILD_RULES.questXpPenalty)
  };
}

export async function saveGuildSettings(fields) {
  requireGM();
  const settings = {
    partyName: cleanText(fields.partyName, 80),
    xpPerRank: parseIntegerSetting(fields.xpPerRank, "Guild XP required per rank", 1),
    questXpAward: parseIntegerSetting(fields.questXpAward, "Guild XP for a completed quest", 1),
    questXpPenalty: parseIntegerSetting(fields.questXpPenalty, "Guild XP penalty for a failed quest", 0)
  };

  await game.settings.set(MODULE_ID, PARTY_NAME_SETTING, settings.partyName);
  await game.settings.set(MODULE_ID, XP_PER_RANK_SETTING, settings.xpPerRank);
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

export async function joinGuild(actor, fields) {
  requirePlayerOwner(actor);
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

export function getGuildRankProgress(guildExperience, xpPerRank = getGuildSettings().xpPerRank) {
  const total = Math.max(0, Math.trunc(Number(guildExperience) || 0));
  const perRank = Math.max(1, Math.trunc(Number(xpPerRank) || DEFAULT_GUILD_RULES.xpPerRank));
  const rankIndex = Math.min(GUILD_RANKS.length - 1, Math.floor(total / perRank));
  const rank = GUILD_RANKS[rankIndex];
  const isMaxRank = rankIndex === GUILD_RANKS.length - 1;

  return {
    rank,
    rankIndex,
    isMaxRank,
    current: isMaxRank ? null : total - (rankIndex * perRank),
    required: isMaxRank ? null : perRank,
    total
  };
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
    rankBefore: getGuildRankProgress(previousExperience, settings.xpPerRank).rank,
    rankAfter: getGuildRankProgress(guildExperience, settings.xpPerRank).rank
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
  return Number.isInteger(value) && value > 0 ? value : fallback;
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

function emptyProfile() {
  return { name: "", className: "", level: "", age: "", gender: "", race: "" };
}

function cleanText(value, maximumLength) {
  return String(value ?? "").trim().slice(0, maximumLength);
}
