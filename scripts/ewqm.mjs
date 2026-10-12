import { openQuestBoard, refreshQuestBoard, refreshQuestSheets } from "./quest-board.js";
import { registerQuestSettings, resolvePartyVotes } from "./quest-store.mjs";
import { registerGuildCardHooks, refreshGuildCardViews } from "./guild-card.js";
import { registerGuildSettings } from "./guild-store.mjs";

const MODULE_ID = "emberwolf-quest-manager";
let voteResolutionQueue = Promise.resolve();

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
    Hooks.on("updateUser", () => {
      queueVoteResolution();
      refreshQuestViews();
    });

    Hooks.on("updateSetting", setting => {
      if ([
        MODULE_ID + ".publishedQuests",
        MODULE_ID + ".partyRoster",
        MODULE_ID + ".geminiRelayUrl",
        MODULE_ID + ".partyName",
        MODULE_ID + ".guildXpPerRank",
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
