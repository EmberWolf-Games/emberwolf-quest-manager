import {
  getCharacterGuildProfile,
  getCharacterLevel,
  getGuildMember,
  getGuildRankProgress,
  getGuildSettings,
  joinGuild
} from "./guild-store.mjs";

const MODULE_ID = "emberwolf-quest-manager";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const openGuildCards = new Map();
const enrollmentCards = new Set();

export function registerGuildCardHooks() {
  Hooks.on("renderApplicationV2", (application, element) => {
    const actor = application.document?.documentName === "Actor"
      ? application.document
      : application.actor;
    if (!canPlayerOpenGuildCard(actor)) return;

    addGuildCardHeaderButton(element, actor);
    if (!getGuildMember(actor) && !enrollmentCards.has(actor.uuid)) {
      enrollmentCards.add(actor.uuid);
      openGuildCard(actor).catch(error => {
        enrollmentCards.delete(actor.uuid);
        console.error(MODULE_ID + " | Could not open the guild membership card.", error);
        ui.notifications.error(error.message ?? "Could not open the guild membership card.");
      });
    }
  });

  Hooks.on("updateActor", actor => {
    if (actor.type !== "character") return;
    const card = openGuildCards.get(actor.uuid);
    if (card?.rendered) card.render();
    refreshGuildCardHeader(actor);
  });

  Hooks.on("closeApplicationV2", application => {
    if (!(application instanceof GuildCardApplication)) return;
    const actor = game.actors.get(application.actorId);
    openGuildCards.delete(application.actorUuid);
    if (!getGuildMember(actor)) enrollmentCards.delete(application.actorUuid);
  });
}

export function refreshGuildCardViews() {
  for (const application of openGuildCards.values()) {
    if (application.rendered) application.render();
    const actor = game.actors.get(application.actorId);
    if (actor) refreshGuildCardHeader(actor);
  }
}

export class GuildCardApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ewqm-guild-card",
    classes: [MODULE_ID, "ewqm-guild-card-window"],
    window: {
      title: "EmberWolf Guild Membership",
      icon: "fa-solid fa-id-card",
      resizable: true
    },
    position: { width: 600, height: 460 },
    actions: {
      "join-guild": this.#joinGuild,
      "defer-enrollment": this.#deferEnrollment
    }
  };

  static PARTS = {
    main: { template: "modules/" + MODULE_ID + "/templates/guild-card.hbs" }
  };

  constructor(actor) {
    super({ id: "ewqm-guild-card-" + actor.id });
    this.actorId = actor.id;
    this.actorUuid = actor.uuid;
  }

  async _prepareContext() {
    const actor = await fromUuid(this.actorUuid);
    if (!canPlayerOpenGuildCard(actor)) return { isMissing: true };

    const membership = getGuildMember(actor);
    const settings = getGuildSettings();
    const profile = membership?.profile ?? getCharacterGuildProfile(actor);
    const level = getCharacterLevel(actor);
    const experience = Math.max(0, Math.trunc(Number(membership?.guildExperience) || 0));
    const progress = getGuildRankProgress(experience, settings.xpPerRank);

    return {
      isMissing: false,
      isEnrollment: !membership,
      name: profile.name ?? "",
      className: profile.className ?? "",
      level: level ? String(level) : "",
      age: profile.age ?? "",
      gender: profile.gender ?? "",
      race: profile.race ?? "",
      rank: progress.rank,
      hasRank: Boolean(membership),
      rankImage: rankImagePath(progress.rank),
      experienceLabel: progress.isMaxRank
        ? "MAX RANK · " + progress.total + " XP"
        : progress.current + "/" + progress.required + " Guild XP",
      xpPerRank: settings.xpPerRank
    };
  }

  static async #joinGuild(event) {
    event.preventDefault();
    try {
      const actor = await fromUuid(this.actorUuid);
      const form = this.element.querySelector("[data-guild-enrollment-form]");
      const fields = Object.fromEntries(new FormData(form).entries());
      const membership = await joinGuild(actor, fields);
      enrollmentCards.delete(this.actorUuid);
      ui.notifications.info("Guild membership recorded for " + membership.profile.name + ". Your starting rank is G.");
      await this.render({ force: true });
      if (actor.sheet?.rendered) await actor.sheet.render();
    } catch (error) {
      console.error(MODULE_ID + " | Could not join the guild.", error);
      ui.notifications.error(error.message ?? "Could not join the guild.");
    }
  }

  static async #deferEnrollment(event) {
    event.preventDefault();
    enrollmentCards.delete(this.actorUuid);
    await this.close();
  }
}

async function openGuildCard(actor) {
  let application = openGuildCards.get(actor.uuid);
  if (!application || !application.rendered) {
    application = new GuildCardApplication(actor);
    openGuildCards.set(actor.uuid, application);
  }
  if (application.rendered) application.bringToFront();
  await application.render({ force: true });
}

function canPlayerOpenGuildCard(actor) {
  if (!game.user || game.user.isGM || game.user.role >= CONST.USER_ROLES.ASSISTANT) return false;
  return actor?.type === "character"
    && actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
}

function addGuildCardHeaderButton(element, actor) {
  if (!(element instanceof HTMLElement)) return;
  const levelBadge = element.querySelector(".sheet-header .right .level-badge");
  if (!levelBadge) return;
  element.querySelector("[data-ewqm-guild-card-trigger]")?.remove();

  const button = document.createElement("button");
  const membership = getGuildMember(actor);
  const rank = membership
    ? getGuildRankProgress(membership.guildExperience).rank
    : "";
  button.type = "button";
  button.className = "ewqm-guild-card-trigger gold-button";
  button.dataset.ewqmGuildCardTrigger = "true";
  button.title = membership ? "View guild card — rank " + rank : "Review and join the Adventuring Guild";
  button.setAttribute("aria-label", membership ? "View guild card, rank " + rank : "Join the Adventuring Guild");
  button.textContent = membership ? rank + "|🪪" : "🪪";

  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    openGuildCard(actor).catch(error => {
      console.error(MODULE_ID + " | Could not open the guild card.", error);
      ui.notifications.error(error.message ?? "Could not open the guild card.");
    });
  });

  const restButtons = element.querySelector(".sheet-header .right .sheet-header-buttons");
  const longRestButton = restButtons?.querySelector(".long-rest");
  if (longRestButton) longRestButton.insertAdjacentElement("afterend", button);
  else if (restButtons) restButtons.append(button);
  else levelBadge.insertAdjacentElement("afterend", button);
}

function refreshGuildCardHeader(actor) {
  const applications = actor.apps instanceof Map ? actor.apps.values() : Object.values(actor.apps ?? {});
  for (const application of applications) {
    const button = application.element?.querySelector("[data-ewqm-guild-card-trigger]");
    if (!button) continue;
    const membership = getGuildMember(actor);
    const rank = membership ? getGuildRankProgress(membership.guildExperience).rank : "";
    button.title = membership ? "View guild card — rank " + rank : "Review and join the Adventuring Guild";
    button.setAttribute("aria-label", membership ? "View guild card, rank " + rank : "Join the Adventuring Guild");
    button.textContent = membership ? rank + "|🪪" : "🪪";
  }
}

function rankImagePath(rank) {
  return "modules/" + MODULE_ID + "/assets/guild/EWAG_" + rank + ".png";
}
