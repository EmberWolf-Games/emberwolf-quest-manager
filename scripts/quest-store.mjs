const MODULE_ID = "emberwolf-quest-manager";
const PUBLIC_QUESTS_SETTING = "publishedQuests";
const PARTY_ROSTER_SETTING = "partyRoster";
const GEMINI_RELAY_SETTING = "geminiRelayUrl";
const PRIVATE_ARCHIVE_FLAG = "privateArchive";
const PRIVATE_QUEST_FLAG = "questRecord";
const QUEST_ID_FLAG = "questId";
const PLAYER_VOTES_FLAG = "questVotes";

const VOTER_ROLE_MINIMUM = CONST.USER_ROLES.PLAYER;
const VOTER_ROLE_LIMIT = CONST.USER_ROLES.ASSISTANT;
const PUBLIC_STATUSES = new Set(["available", "accepted", "declined"]);

export function registerQuestSettings() {
  game.settings.register(MODULE_ID, PUBLIC_QUESTS_SETTING, {
    name: "Public Quest Board Records",
    hint: "Published quest details used by the EmberWolf Quest Board.",
    scope: "world",
    config: false,
    type: String,
    default: "[]"
  });
  game.settings.register(MODULE_ID, PARTY_ROSTER_SETTING, {
    name: "Quest Generator Party Roster",
    hint: "World character IDs explicitly selected by a Gamemaster for party-level quest generation.",
    scope: "world",
    config: false,
    type: String,
    default: "[]"
  });
  game.settings.register(MODULE_ID, GEMINI_RELAY_SETTING, {
    name: "Quest Board Gemini Relay URL",
    hint: "GM-client relay endpoint used to draft guild-clerk notes. No API key is stored by the module.",
    scope: "client",
    config: false,
    type: String,
    default: ""
  });
}

export function getGeminiRelayUrl() {
  if (!game.user?.isGM) return "";
  return String(game.settings.get(MODULE_ID, GEMINI_RELAY_SETTING) ?? "").trim();
}

export async function saveGeminiRelayUrl(value) {
  requireGM();
  const relayUrl = cleanText(value, 500);
  if (relayUrl) {
    let parsed;
    try {
      parsed = new URL(relayUrl);
    } catch {
      throw new Error("Enter a valid HTTPS relay URL, or a local HTTP URL such as http://127.0.0.1:30001/gemini/clerk-note.");
    }
    const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
    if (!new Set(["https:", "http:"]).has(parsed.protocol)
      || (parsed.protocol === "http:" && !localHosts.has(parsed.hostname))
      || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error("Use HTTPS for a remote relay. HTTP is allowed only for a local relay, and relay URLs cannot contain credentials or query parameters.");
    }
  }
  await game.settings.set(MODULE_ID, GEMINI_RELAY_SETTING, relayUrl);
  return relayUrl;
}

export function getPartyRoster() {
  const selectedIds = new Set(readPartyRosterIds());
  return game.actors.contents
    .filter(actor => actor.type === "character")
    .map(actor => {
      const level = getCharacterLevel(actor);
      return {
        id: actor.id,
        name: actor.name,
        level,
        levelLabel: level ? "Level " + level : "Level unavailable",
        isSelected: selectedIds.has(actor.id),
        isSelectable: Number.isInteger(level) && level >= 1 && level <= 20
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getPartyMembers() {
  const actors = new Map(game.actors.contents.map(actor => [actor.id, actor]));
  return readPartyRosterIds().map(id => actors.get(id)).filter(actor => actor?.type === "character")
    .map(actor => ({ id: actor.id, name: actor.name, level: getCharacterLevel(actor) }))
    .filter(member => Number.isInteger(member.level) && member.level >= 1 && member.level <= 20);
}

export async function savePartyRoster(actorIds) {
  requireGM();
  const requestedIds = [...new Set((Array.isArray(actorIds) ? actorIds : []).map(id => String(id)))];
  const actors = new Map(game.actors.contents.map(actor => [actor.id, actor]));
  const validIds = [];
  for (const id of requestedIds) {
    const actor = actors.get(id);
    if (!actor || actor.type !== "character") {
      throw new Error("The party roster can include only character actors in this world.");
    }
    const level = getCharacterLevel(actor);
    if (!Number.isInteger(level) || level < 1 || level > 20) {
      throw new Error(actor.name + " does not have a usable dnd5e character level.");
    }
    validIds.push(id);
  }
  await game.settings.set(MODULE_ID, PARTY_ROSTER_SETTING, JSON.stringify(validIds));
  return getPartyMembers();
}

export function getPublishedQuests() {
  const stored = game.settings.get(MODULE_ID, PUBLIC_QUESTS_SETTING);
  try {
    const parsed = JSON.parse(stored || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(MODULE_ID + " | Published quest data is not valid JSON.", error);
    return [];
  }
}

export function getEligibleVoters() {
  return game.users.contents.filter(user =>
    user.role >= VOTER_ROLE_MINIMUM && user.role < VOTER_ROLE_LIMIT
  );
}

export function getVoteSummary(quest) {
  const voters = getEligibleVoters();
  let accept = 0;
  let decline = 0;

  for (const user of voters) {
    const choices = user.getFlag(MODULE_ID, PLAYER_VOTES_FLAG) ?? {};
    if (choices[quest.voteRoundId] === "accept") accept += 1;
    if (choices[quest.voteRoundId] === "decline") decline += 1;
  }

  const required = voters.length === 0 ? 0 : Math.floor(voters.length / 2) + 1;
  let outcome = null;
  if (required > 0 && accept >= required) outcome = "accepted";
  else if (required > 0 && decline >= required) outcome = "declined";

  return { accept, decline, eligible: voters.length, required, outcome };
}

export async function getPrivateQuests() {
  requireGM();
  return game.journal.contents
    .map(entry => entry.getFlag(MODULE_ID, PRIVATE_QUEST_FLAG))
    .filter(Boolean)
    .map(record => foundry.utils.deepClone(record));
}

export async function getPrivateQuest(questId) {
  const quests = await getPrivateQuests();
  return quests.find(quest => quest.id === questId) ?? null;
}

export async function saveDraft(questId, fields) {
  requireGM();
  const title = cleanText(fields.title, 120);
  const description = cleanText(fields.description, 4000);
  const gmNotes = cleanText(fields.gmNotes, 4000);
  if (!title) throw new Error("Enter a quest title.");
  if (!description) throw new Error("Add a public description before saving this quest.");

  const quests = await getPrivateQuests();
  const existing = quests.find(quest => quest.id === questId);
  const clerkNote = cleanText(fields.clerkNote ?? existing?.clerkNote ?? "", 1200);
  const now = Date.now();
  const categoryId = cleanText(fields.categoryId || existing?.categoryId, 80);
  const categoryLabel = cleanText(fields.categoryLabel || existing?.categoryLabel, 80);
  const urgencyId = cleanText(fields.urgencyId || existing?.urgencyId, 40);
  const urgencyLabel = cleanText(fields.urgencyLabel || existing?.urgencyLabel, 40);
  const rewardCandidate = fields.rewardCopper ?? existing?.rewardCopper;
  const rewardCopper = rewardCandidate !== null
    && rewardCandidate !== undefined
    && rewardCandidate !== ""
    && Number.isFinite(Number(rewardCandidate))
    && Number(rewardCandidate) >= 0
    ? Math.round(Number(rewardCandidate))
    : null;
  const generationMetadata = fields.generationMetadata
    ? foundry.utils.deepClone(fields.generationMetadata)
    : existing?.generationMetadata ?? null;
  const record = existing
    ? { ...existing, title, description, clerkNote, gmNotes, categoryId, categoryLabel, urgencyId, urgencyLabel, rewardCopper, generationMetadata, updatedAt: now }
    : {
        id: foundry.utils.randomID(),
        title,
        description,
        clerkNote,
        gmNotes,
        categoryId,
        categoryLabel,
        urgencyId,
        urgencyLabel,
        rewardCopper,
        generationMetadata,
        status: "draft",
        voteRoundId: null,
        createdAt: now,
        updatedAt: now
      };

  await persistPrivateQuest(record);
  if (PUBLIC_STATUSES.has(record.status)) await syncPublicQuests();
  return record;
}

export async function publishQuest(questId) {
  requireGM();
  const record = await getPrivateQuest(questId);
  if (!record) throw new Error("That quest draft could not be found.");
  if (record.status === "available") return record;
  record.status = "available";
  record.voteRoundId = foundry.utils.randomID();
  record.updatedAt = Date.now();
  await persistPrivateQuest(record);
  await syncPublicQuests();
  return record;
}

export async function closeQuest(questId) {
  requireGM();
  const record = await getPrivateQuest(questId);
  if (!record) throw new Error("That quest could not be found.");
  record.status = "closed";
  record.updatedAt = Date.now();
  await persistPrivateQuest(record);
  await syncPublicQuests();
  return record;
}

export async function deleteQuest(questId) {
  requireGM();
  const entry = game.journal.contents.find(document =>
    document.getFlag(MODULE_ID, QUEST_ID_FLAG) === questId
  );
  if (!entry) throw new Error("That quest could not be found in the GM archive.");
  await entry.delete();
  await syncPublicQuests();
}

export async function reopenQuest(questId) {
  requireGM();
  const record = await getPrivateQuest(questId);
  if (!record) throw new Error("That quest could not be found.");
  record.status = "available";
  record.voteRoundId = foundry.utils.randomID();
  record.updatedAt = Date.now();
  await persistPrivateQuest(record);
  await syncPublicQuests();
  return record;
}

export async function castPartyVote(questId, choice) {
  if (game.user.isGM) throw new Error("Gamemasters cannot cast party votes.");
  if (choice !== "accept" && choice !== "decline") throw new Error("Choose accept or decline.");

  const quest = getPublishedQuests().find(record => record.id === questId);
  if (!quest || quest.status !== "available") throw new Error("This quest is not open for a party vote.");
  if (getVoteSummary(quest).outcome) throw new Error("The party vote is already decided.");

  const current = game.user.getFlag(MODULE_ID, PLAYER_VOTES_FLAG) ?? {};
  await game.user.setFlag(MODULE_ID, PLAYER_VOTES_FLAG, {
    ...current,
    [quest.voteRoundId]: choice
  });
}

export async function resolvePartyVotes() {
  if (!game.user?.isGM) return;
  const quests = await getPrivateQuests();
  let changed = false;

  for (const quest of quests) {
    if (quest.status !== "available") continue;
    const result = getVoteSummary(quest);
    if (!result.outcome) continue;
    quest.status = result.outcome;
    quest.updatedAt = Date.now();
    await persistPrivateQuest(quest);
    changed = true;
  }

  if (changed) await syncPublicQuests();
}

async function persistPrivateQuest(record) {
  const archive = await ensurePrivateArchive();
  const existing = game.journal.contents.find(entry => entry.getFlag(MODULE_ID, QUEST_ID_FLAG) === record.id);
  const name = "EWQM | " + record.title;
  if (existing) {
    await existing.update({ name, folder: archive.id });
    await existing.setFlag(MODULE_ID, PRIVATE_QUEST_FLAG, record);
    return;
  }

  await JournalEntry.create({
    name,
    folder: archive.id,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
    flags: {
      [MODULE_ID]: {
        [QUEST_ID_FLAG]: record.id,
        [PRIVATE_QUEST_FLAG]: record
      }
    }
  });
}

async function ensurePrivateArchive() {
  let archive = game.folders.contents.find(folder =>
    folder.type === "JournalEntry" && folder.getFlag(MODULE_ID, PRIVATE_ARCHIVE_FLAG)
  );
  if (archive) return archive;

  archive = await Folder.create({
    name: "EWQM — GM Archive",
    type: "JournalEntry",
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
    flags: { [MODULE_ID]: { [PRIVATE_ARCHIVE_FLAG]: true } }
  });
  return archive;
}

async function syncPublicQuests() {
  const quests = await getPrivateQuests();
  const publicQuests = quests
    .filter(quest => PUBLIC_STATUSES.has(quest.status))
    .map(quest => ({
      id: quest.id,
      title: quest.title,
      description: quest.description,
      clerkNote: quest.clerkNote ?? "",
      categoryId: quest.categoryId ?? "",
      categoryLabel: quest.categoryLabel ?? "",
      urgencyId: quest.urgencyId ?? "",
      urgencyLabel: quest.urgencyLabel ?? "",
      rewardCopper: quest.rewardCopper !== null && quest.rewardCopper !== undefined && Number.isFinite(Number(quest.rewardCopper))
        ? Number(quest.rewardCopper)
        : null,
      status: quest.status,
      voteRoundId: quest.voteRoundId,
      createdAt: quest.createdAt,
      updatedAt: quest.updatedAt
    }));
  await game.settings.set(MODULE_ID, PUBLIC_QUESTS_SETTING, JSON.stringify(publicQuests));
}

function requireGM() {
  if (!game.user?.isGM) throw new Error("Only a Gamemaster can manage quests.");
}

function cleanText(value, maximumLength) {
  return String(value ?? "").trim().slice(0, maximumLength);
}

function readPartyRosterIds() {
  try {
    const stored = game.settings.get(MODULE_ID, PARTY_ROSTER_SETTING);
    const parsed = JSON.parse(stored || "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.map(id => String(id)))] : [];
  } catch (error) {
    console.error(MODULE_ID + " | Party roster data is not valid JSON.", error);
    return [];
  }
}

function getCharacterLevel(actor) {
  let rollLevel;
  try {
    rollLevel = Number(actor.getRollData?.()?.details?.level);
  } catch (error) {
    console.debug(MODULE_ID + " | Could not read dnd5e roll-data character level for " + actor.name + ".", error);
  }
  const level = Number.isInteger(rollLevel) && rollLevel > 0
    ? rollLevel
    : Number(actor.system?.details?.level);
  return Number.isInteger(level) ? level : null;
}
