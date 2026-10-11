import { openQuestBoard, refreshQuestBoard } from "./quest-board.js";
import { registerQuestSettings, resolvePartyVotes } from "./quest-store.mjs";

const MODULE_ID = "emberwolf-quest-manager";
let voteResolutionQueue = Promise.resolve();

function queueVoteResolution() {
  if (!game.user?.isGM) return;
  voteResolutionQueue = voteResolutionQueue
    .then(() => resolvePartyVotes())
    .catch(error => console.error(MODULE_ID + " | Could not resolve party votes.", error));
}

Hooks.once("init", () => {
  ensureStylesheet();
  registerQuestSettings();

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
      refreshQuestBoard();
    });

    Hooks.on("updateSetting", setting => {
      if (setting.key === MODULE_ID + ".publishedQuests") refreshQuestBoard();
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
