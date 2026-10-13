const MODULE_ID = "emberwolf-quest-manager";
const REWARD_TABLE_FLAG = "questRewardRank";
const REWARD_MULTIPLIER_FLAG = "questRewardMultiplier";
const REWARD_TABLE_FOLDER_FLAG = "questRewardTableFolder";

/**
 * Challenge ranks each get a reusable Foundry RollTable. Results roll a payout
 * adjustment; category, urgency, workload, and target risk are applied later.
 */
export const QUEST_REWARD_TABLES = Object.freeze({
  routine: Object.freeze({
    label: "Routine",
    results: Object.freeze([
      { weight: 35, multiplier: 0.8 },
      { weight: 35, multiplier: 0.9 },
      { weight: 20, multiplier: 1 },
      { weight: 10, multiplier: 1.1 }
    ])
  }),
  standard: Object.freeze({
    label: "Standard",
    results: Object.freeze([
      { weight: 15, multiplier: 0.85 },
      { weight: 30, multiplier: 0.95 },
      { weight: 35, multiplier: 1 },
      { weight: 15, multiplier: 1.1 },
      { weight: 5, multiplier: 1.2 }
    ])
  }),
  "high-risk": Object.freeze({
    label: "High Risk",
    results: Object.freeze([
      { weight: 10, multiplier: 0.9 },
      { weight: 20, multiplier: 1 },
      { weight: 30, multiplier: 1.15 },
      { weight: 25, multiplier: 1.3 },
      { weight: 15, multiplier: 1.5 }
    ])
  })
});

let tableSetupPromise;

export function ensureQuestRewardTables() {
  if (!game.user?.isGM) return Promise.resolve([]);
  if (tableSetupPromise) return tableSetupPromise;

  tableSetupPromise = createMissingRewardTables().catch(error => {
    tableSetupPromise = null;
    throw error;
  });
  return tableSetupPromise;
}

export async function rollQuestReward(rankId) {
  const rank = QUEST_REWARD_TABLES[rankId];
  if (!rank) throw new Error("Choose a valid quest rank for the reward roll.");

  await ensureQuestRewardTables();
  const table = game.tables.contents.find(document => document.getFlag(MODULE_ID, REWARD_TABLE_FLAG) === rankId);
  if (!table) throw new Error("The EWQM " + rank.label + " reward table is unavailable. Reload the world and try again.");

  const draw = await table.roll();
  const result = draw.results?.[0];
  const storedMultiplier = result?.getFlag(MODULE_ID, REWARD_MULTIPLIER_FLAG);
  const textMultiplier = String(result?.text ?? "").match(/\d+(?:\.\d+)?/);
  const multiplier = Number(textMultiplier?.[0] ?? storedMultiplier);
  if (!result || !Number.isFinite(multiplier) || multiplier <= 0) {
    throw new Error("The EWQM " + rank.label + " reward table produced a result without a valid payout multiplier.");
  }

  return {
    tableId: table.id,
    tableName: table.name,
    formula: draw.roll?.formula ?? table.formula,
    rollTotal: Number(draw.roll?.total),
    result: String(result.text ?? multiplier),
    multiplier
  };
}

async function createMissingRewardTables() {
  let folder = game.folders.contents.find(document =>
    document.type === "RollTable" && document.getFlag(MODULE_ID, REWARD_TABLE_FOLDER_FLAG)
  );

  if (!folder) {
    folder = await Folder.create({
      name: "EWQM — Quest Reward Tables",
      type: "RollTable",
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
      flags: { [MODULE_ID]: { [REWARD_TABLE_FOLDER_FLAG]: true } }
    });
  }

  const tables = [];
  for (const [rankId, rank] of Object.entries(QUEST_REWARD_TABLES)) {
    let table = game.tables.contents.find(document => document.getFlag(MODULE_ID, REWARD_TABLE_FLAG) === rankId);
    if (!table) {
      let nextRange = 1;
      const results = rank.results.map(entry => {
        const range = [nextRange, nextRange + entry.weight - 1];
        nextRange = range[1] + 1;
        return {
          type: CONST.TABLE_RESULT_TYPES.TEXT,
          text: entry.multiplier.toFixed(2) + "× reward multiplier",
          weight: entry.weight,
          range,
          drawn: false,
          flags: { [MODULE_ID]: { [REWARD_MULTIPLIER_FLAG]: entry.multiplier } }
        };
      });

      table = await RollTable.create({
        name: "EWQM | " + rank.label + " Quest Rewards",
        description: "A reusable d100 payout adjustment for " + rank.label.toLowerCase() + " commissions. The generator then applies category, urgency, workload, and target-risk multipliers.",
        formula: "1d100",
        replacement: true,
        displayRoll: false,
        folder: folder.id,
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
        results,
        flags: { [MODULE_ID]: { [REWARD_TABLE_FLAG]: rankId } }
      });
    }
    tables.push(table);
  }

  return tables;
}

