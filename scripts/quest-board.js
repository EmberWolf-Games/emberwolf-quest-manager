import {
  castPartyVote,
  closeQuest,
  getEligibleVoters,
  getPartyMembers,
  getPartyRoster,
  getPrivateQuest,
  getPrivateQuests,
  getPublishedQuests,
  getVoteSummary,
  publishQuest,
  reopenQuest,
  saveDraft,
  savePartyRoster
} from "./quest-store.mjs";
import { generateQuests } from "./quest-generator.mjs";
import { CHALLENGE_OPTIONS, GENERATION_CATEGORIES, RULESET_OPTIONS, URGENCY_OPTIONS } from "./quest-pools.mjs";

const MODULE_ID = "emberwolf-quest-manager";
const PLAYER_VOTES_FLAG = "questVotes";
const STATUS_LABELS = {
  draft: "Draft",
  available: "Open for party vote",
  accepted: "Accepted by the party",
  declined: "Declined by the party",
  closed: "Closed"
};

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
let activeBoard = null;

export class QuestBoardApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ewqm-quest-board",
    classes: [MODULE_ID, "ewqm-quest-board-window"],
    window: {
      title: "EmberWolf Quest Board",
      icon: "fa-solid fa-scroll",
      resizable: true
    },
    position: { width: 900, height: 760 },
    actions: {
      "save-quest": this.#saveQuest,
      "cancel-edit": this.#cancelEdit,
      "edit-quest": this.#editQuest,
      "publish-quest": this.#publishQuest,
      "close-quest": this.#closeQuest,
      "reopen-quest": this.#reopenQuest,
      "cast-party-vote": this.#castPartyVote,
      "save-party-roster": this.#savePartyRoster,
      "generate-quests": this.#generateQuests
    }
  };

  static PARTS = {
    main: { template: "modules/" + MODULE_ID + "/templates/quest-board.hbs" }
  };

  async _prepareContext() {
    const isGM = game.user.isGM;
    const sourceQuests = isGM ? await getPrivateQuests() : getPublishedQuests();
    const eligibleVoters = getEligibleVoters();
    const partyRoster = isGM ? getPartyRoster() : [];
    const partyMembers = isGM ? await getPartyMembers() : [];
    const partyLevel = partyMembers.length
      ? Math.floor(partyMembers.reduce((sum, member) => sum + member.level, 0) / partyMembers.length)
      : null;
    const editingQuest = isGM && this.editingQuestId
      ? sourceQuests.find(quest => quest.id === this.editingQuestId)
      : null;
    const quests = sourceQuests
      .filter(quest => isGM || quest.status !== "closed")
      .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))
      .map(quest => this.#prepareQuestCard(quest, isGM));

    return {
      isGM,
      isPlayer: !isGM,
      hasQuests: quests.length > 0,
      hasPlayerUsers: eligibleVoters.length > 0,
      playerCount: eligibleVoters.length,
      partyRoster,
      hasPartyRoster: partyMembers.length > 0,
      partyRosterCount: partyMembers.length,
      partyLevel,
      hasCharacterActors: partyRoster.some(actor => actor.isSelectable),
      generationCategories: [{ id: "", label: "Any category" }, ...GENERATION_CATEGORIES],
      challengeOptions: CHALLENGE_OPTIONS.map(option => ({ ...option, isDefault: option.id === "standard" })),
      urgencyOptions: URGENCY_OPTIONS,
      rulesetOptions: RULESET_OPTIONS,
      editingQuestId: this.editingQuestId ?? "",
      isEditing: Boolean(this.editingQuestId),
      editingTitle: editingQuest?.title ?? "",
      editingDescription: editingQuest?.description ?? "",
      editingGmNotes: editingQuest?.gmNotes ?? "",
      quests
    };
  }

  #prepareQuestCard(quest, isGM) {
    const tally = getVoteSummary(quest);
    const projectedOutcome = quest.status === "available" ? tally.outcome : null;
    const displayStatus = projectedOutcome ?? quest.status;
    const myVotes = game.user.getFlag(MODULE_ID, PLAYER_VOTES_FLAG) ?? {};
    const myVote = myVotes[quest.voteRoundId] ?? "";
    const isAvailable = displayStatus === "available";
    const hasReward = quest.rewardCopper !== null
      && quest.rewardCopper !== undefined
      && Number.isFinite(Number(quest.rewardCopper));

    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      gmNotes: isGM ? quest.gmNotes : "",
      hasGmNotes: isGM && Boolean(quest.gmNotes),
      status: displayStatus,
      statusLabel: STATUS_LABELS[displayStatus] ?? "Unknown status",
      statusClass: displayStatus,
      isDraft: displayStatus === "draft",
      isAvailable,
      isAccepted: displayStatus === "accepted",
      isDeclined: displayStatus === "declined",
      isClosed: displayStatus === "closed",
      canVote: !isGM && isAvailable && !tally.outcome,
      pendingOutcome: !isGM && quest.status === "available" && Boolean(tally.outcome),
      isMyAccept: myVote === "accept",
      isMyDecline: myVote === "decline",
      acceptVotes: tally.accept,
      declineVotes: tally.decline,
      requiredVotes: tally.required,
      eligibleVoters: tally.eligible,
      voteSummary: tally.eligible === 0
        ? "No player accounts are configured for this world."
        : tally.accept + " accept · " + tally.decline + " decline · " + tally.required + " needed for a majority",
      createdLabel: formatDate(quest.createdAt),
      canClose: isGM && PUBLIC_STATUSES.has(quest.status),
      canReopen: isGM && ["accepted", "declined", "closed"].includes(quest.status),
      canPublish: isGM && quest.status === "draft",
      canEdit: isGM,
      categoryLabel: quest.categoryLabel ?? "",
      urgencyLabel: quest.urgencyLabel ?? "",
      hasPublicDetails: Boolean(quest.categoryLabel || quest.urgencyLabel || hasReward),
      rewardLabel: hasReward ? formatCurrency(Number(quest.rewardCopper)) : ""
    };
  }

  static async #savePartyRoster(event) {
    event.preventDefault();
    try {
      const form = this.element.querySelector("[data-generator-form]");
      const selectedActorIds = [...form.querySelectorAll('[name="actorIds"]:checked')].map(input => input.value);
      const party = await savePartyRoster(selectedActorIds);
      const level = party.length
        ? Math.floor(party.reduce((sum, member) => sum + member.level, 0) / party.length)
        : null;
      ui.notifications.info(level ? "Party roster saved. Average party level: " + level + "." : "Party roster cleared.");
      await this.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not save party roster.", error);
      ui.notifications.error(error.message ?? "Could not save the party roster.");
    }
  }

  static async #generateQuests(event) {
    event.preventDefault();
    try {
      const form = this.element.querySelector("[data-generator-form]");
      const fields = Object.fromEntries(new FormData(form).entries());
      const selectedActorIds = [...form.querySelectorAll('[name="actorIds"]:checked')].map(input => input.value);
      await savePartyRoster(selectedActorIds);
      const party = await getPartyMembers();
      const records = await generateQuests({
        categoryId: fields.categoryId,
        difficultyId: fields.difficultyId,
        urgencyId: fields.urgencyId,
        rulesetId: fields.rulesetId,
        count: fields.count,
        party
      });
      const savedRecords = [];
      for (const record of records) savedRecords.push(await saveDraft(null, record));
      this.editingQuestId = savedRecords.at(-1)?.id ?? null;
      ui.notifications.info(savedRecords.length + " quest draft" + (savedRecords.length === 1 ? "" : "s") + " generated for GM review.");
      await this.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not generate quests.", error);
      ui.notifications.error(error.message ?? "Could not generate quests.");
    }
  }

  static async #saveQuest(event) {
    event.preventDefault();
    try {
      const form = this.element.querySelector("[data-quest-form]");
      const fields = Object.fromEntries(new FormData(form).entries());
      const record = await saveDraft(fields.questId, fields);
      this.editingQuestId = null;
      ui.notifications.info(record.status === "draft" ? "Quest draft saved." : "Quest updated.");
      await this.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not save quest.", error);
      ui.notifications.error(error.message ?? "Could not save the quest.");
    }
  }

  static async #cancelEdit(event) {
    event.preventDefault();
    this.editingQuestId = null;
    await this.render();
  }

  static async #editQuest(event, target) {
    event.preventDefault();
    try {
      const quest = await getPrivateQuest(target.dataset.questId);
      if (!quest) throw new Error("That quest could not be found.");
      this.editingQuestId = quest.id;
      await this.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not open quest for editing.", error);
      ui.notifications.error(error.message ?? "Could not edit the quest.");
    }
  }

  static async #publishQuest(event, target) {
    event.preventDefault();
    try {
      await publishQuest(target.dataset.questId);
      ui.notifications.info("Quest published to the party board.");
      await this.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not publish quest.", error);
      ui.notifications.error(error.message ?? "Could not publish the quest.");
    }
  }

  static async #closeQuest(event, target) {
    event.preventDefault();
    try {
      await closeQuest(target.dataset.questId);
      ui.notifications.info("Quest closed and removed from the party board.");
      await this.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not close quest.", error);
      ui.notifications.error(error.message ?? "Could not close the quest.");
    }
  }

  static async #reopenQuest(event, target) {
    event.preventDefault();
    try {
      await reopenQuest(target.dataset.questId);
      ui.notifications.info("Quest reopened with a fresh party vote.");
      await this.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not reopen quest.", error);
      ui.notifications.error(error.message ?? "Could not reopen the quest.");
    }
  }

  static async #castPartyVote(event, target) {
    event.preventDefault();
    try {
      await castPartyVote(target.dataset.questId, target.dataset.vote);
      ui.notifications.info("Your choice was added to the party vote.");
      await this.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not record party vote.", error);
      ui.notifications.error(error.message ?? "Could not record your vote.");
    }
  }
}

const PUBLIC_STATUSES = new Set(["available", "accepted", "declined"]);

export function openQuestBoard() {
  if (!activeBoard || !activeBoard.rendered) activeBoard = new QuestBoardApplication();
  return activeBoard.render({ force: true });
}

export function refreshQuestBoard() {
  if (activeBoard?.rendered) return activeBoard.render();
  return Promise.resolve();
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString();
}

function formatCurrency(copper) {
  const value = Math.max(0, Math.trunc(copper));
  const gold = Math.floor(value / 100);
  const silver = Math.floor((value % 100) / 10);
  const remainingCopper = value % 10;
  return [
    gold ? gold + " GP" : "",
    silver ? silver + " SP" : "",
    remainingCopper ? remainingCopper + " CP" : ""
  ].filter(Boolean).join(", ") || "0 CP";
}
