import { openQuestBoard, refreshQuestBoard, refreshQuestDeadlineLabels, refreshQuestSheets } from "./quest-board.js";
import {
  advanceQuestDeadlinesByRounds,
  registerQuestSettings,
  resolvePartyVotes,
  syncQuestDeadlineClock
} from "./quest-store.mjs";
import { registerGuildCardHooks, refreshGuildCardViews } from "./guild-card.js";
import { GUILD_RANK_XP_SETTING_KEYS, registerGuildSettings } from "./guild-store.mjs";
import { ensureQuestRewardTables } from "./reward-tables.mjs";

const MODULE_ID = "emberwolf-quest-manager";
let voteResolutionQueue = Promise.resolve();
let deadlineQueue = Promise.resolve();
const observedCombatRounds = new Map();
let previousPublishedQuests = null;

function refreshQuestViews() {
  refreshQuestBoard();
  refreshQuestSheets();
}

function queueVoteResolution() {
  if (!game.user?.isGM) return;
  voteResolutionQueue = voteResolutionQueue
    .then(() => resolvePartyVotes())
    .catch(error => console.error(MODULE_ID + " | Could not resolve party votes.", error));
}

Hooks.once("init", () => {
  ensureStylesheet();
  registerQuestSettings();
  registerGuildSettings();
  registerGuildCardHooks();

  Hooks.on("getSceneControlButtons", controls => {
    const tokenControls = controls.tokens;
    if (!tokenControls) return;
    tokenControls.tools ??= {};
    tokenControls.tools.ewqmQuestBoard = {
      name: "ewqmQuestBoard",
      title: "EmberWolf Quest Board",
      icon: "fa-solid fa-scroll",
      order: Object.keys(tokenControls.tools).length,
      button: true,
      visible: true,
      onChange: () => openQuestBoard()
    };
  });

  Hooks.once("ready", () => {
    previousPublishedQuests = readPublishedQuests();
    for (const combat of game.combats.contents) {
      observedCombatRounds.set(combat.id, Number(combat.round) || 0);
    }

    if (game.user?.isGM && isDeadlineCoordinator()) {
      Promise.all([
        ensureQuestRewardTables(),
        syncQuestDeadlineClock({
          paused: Boolean(game.paused),
          combatActive: Boolean(game.combat?.started),
          countRealtimeElapsed: !game.paused
        })
      ]).catch(error => console.error(MODULE_ID + " | Could not initialize reward tables or quest timers.", error));
    }

    window.setInterval(refreshQuestDeadlineLabels, 1000);

    Hooks.on("updateUser", () => {
      queueVoteResolution();
      refreshQuestViews();
    });

    Hooks.on("pauseGame", paused => {
      refreshQuestDeadlineLabels();
      if (!game.user?.isGM || !isDeadlineCoordinator()) return;
      queueDeadlineUpdate(() => syncQuestDeadlineClock({
        paused: Boolean(paused),
        combatActive: Boolean(game.combat?.started),
        countRealtimeElapsed: true
      }), "Could not update quest timers after a pause change.");
    });

    Hooks.on("updateCombat", (combat, changed) => {
      if (Object.hasOwn(changed ?? {}, "round")) {
        const nextRound = Number(combat.round);
        const previousRound = observedCombatRounds.get(combat.id);
        observedCombatRounds.set(combat.id, Number.isFinite(nextRound) ? nextRound : 0);
        const roundsElapsed = Number.isFinite(previousRound) && Number.isFinite(nextRound)
          ? Math.max(0, nextRound - previousRound)
          : 0;
        if (roundsElapsed > 0
          && !Object.hasOwn(changed, "started")
          && game.combat?.id === combat.id
          && combat.started
          && !game.paused
          && game.user?.isGM
          && isDeadlineCoordinator()) {
          queueDeadlineUpdate(() => advanceQuestDeadlinesByRounds(roundsElapsed), "Could not advance quest timers for the combat round.");
        }
      } else if (Object.hasOwn(changed ?? {}, "started")) {
        observedCombatRounds.set(combat.id, Number(combat.round) || 0);
      }

      if (!Object.hasOwn(changed ?? {}, "started")) return;
      refreshQuestDeadlineLabels();
      if (!game.user?.isGM || !isDeadlineCoordinator()) return;
      queueDeadlineUpdate(() => syncQuestDeadlineClock({
        paused: Boolean(game.paused),
        combatActive: Boolean(combat.started),
        countRealtimeElapsed: Boolean(combat.started)
      }), "Could not switch quest timers between real time and combat rounds.");
    });

    Hooks.on("updateSetting", setting => {
      if (setting.key === MODULE_ID + ".publishedQuests") {
        const currentPublishedQuests = readPublishedQuests();
        const onlyDeadlinesChanged = hasOnlyDeadlineChanges(previousPublishedQuests, currentPublishedQuests);
        previousPublishedQuests = currentPublishedQuests;
        if (onlyDeadlinesChanged) {
          refreshQuestDeadlineLabels(currentPublishedQuests);
          return;
        }
        refreshQuestViews();
        refreshGuildCardViews();
        return;
      }

      if ([
        MODULE_ID + ".partyRoster",
        MODULE_ID + ".geminiRelayUrl",
        MODULE_ID + ".partyName",
        ...GUILD_RANK_XP_SETTING_KEYS.map(key => MODULE_ID + "." + key),
        MODULE_ID + ".guildQuestXpAward",
        MODULE_ID + ".guildQuestXpPenalty"
      ].includes(setting.key)) {
        refreshQuestViews();
        refreshGuildCardViews();
      }
    });

    queueVoteResolution();
  });
});

console.info(MODULE_ID + " | Quest board module loaded.");

function ensureStylesheet() {
  const href = new URL("../styles/quest-board.css", import.meta.url).href;
  const alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .some(link => link.href === href);
  if (alreadyLoaded) return;

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = href;
  stylesheet.dataset.ewqmStylesheet = "true";
  document.head.append(stylesheet);
}

function isDeadlineCoordinator() {
  const activeGamemasters = game.users.contents
    .filter(user => user.isGM && user.active)
    .sort((left, right) => left.id.localeCompare(right.id));
  return !activeGamemasters.length || activeGamemasters[0].id === game.user?.id;
}

function queueDeadlineUpdate(operation, errorMessage) {
  deadlineQueue = deadlineQueue
    .then(operation)
    .catch(error => console.error(MODULE_ID + " | " + errorMessage, error));
}

function readPublishedQuests() {
  try {
    const value = JSON.parse(game.settings.get(MODULE_ID, "publishedQuests") || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(MODULE_ID + " | Could not read published quests while updating deadline labels.", error);
    return [];
  }
}

function hasOnlyDeadlineChanges(previous, current) {
  if (!Array.isArray(previous) || previous.length !== current.length) return false;
  const withoutTimer = quests => quests.map(quest => {
    const { deadline, ...record } = quest;
    return record;
  });
  return JSON.stringify(withoutTimer(previous)) === JSON.stringify(withoutTimer(current));
}

