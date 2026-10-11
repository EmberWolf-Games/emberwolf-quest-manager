/**
 * Editable starter pools. Each category defines four compatible arrays:
 * actions, quantities, targets, and rewards. Values are balancing defaults,
 * not settled game rules; see docs/quest-generation.md.
 */
export const QUEST_POOLS = {
  combat: {
    label: "Combat",
    actions: ["Defeat", "Drive off", "Hunt down"],
    quantities: [
      { id: "single", formula: "1", maximum: 1, minimumPartyLevel: 1, rewardMultiplier: 0.9 },
      { id: "one-or-two", formula: "1d2", maximum: 2, minimumPartyLevel: 1, rewardMultiplier: 1 },
      { id: "one-to-four", formula: "1d4", maximum: 4, minimumPartyLevel: 2, rewardMultiplier: 1.15 },
      { id: "two-to-eight", formula: "2d4", maximum: 8, minimumPartyLevel: 5, rewardMultiplier: 1.35 }
    ],
    targetSource: "dnd5e.monsters",
    rewardMultiplier: 1.35,
    rewards: [
      { minimumPartyLevel: 1, maximumPartyLevel: 4, baseCopper: 250 },
      { minimumPartyLevel: 5, maximumPartyLevel: 10, baseCopper: 1500 },
      { minimumPartyLevel: 11, maximumPartyLevel: 16, baseCopper: 8000 },
      { minimumPartyLevel: 17, maximumPartyLevel: 20, baseCopper: 40000 }
    ]
  },
  gathering: {
    label: "Gathering",
    actions: ["Collect", "Harvest", "Recover"],
    quantities: [
      { id: "small-batch", formula: "1d4", unit: "bundles of", maximum: 4, minimumPartyLevel: 1, rewardMultiplier: 1 },
      { id: "full-batch", formula: "2d4", unit: "bundles of", maximum: 8, minimumPartyLevel: 3, rewardMultiplier: 1.35 },
      { id: "large-batch", formula: "2d6", unit: "bundles of", maximum: 12, minimumPartyLevel: 7, rewardMultiplier: 1.65 }
    ],
    targets: [
      { id: "healing-herbs", name: "healing herbs", challengeRank: 1, rewardMultiplier: 0.8 },
      { id: "silver-ore", name: "silver ore", challengeRank: 3, rewardMultiplier: 1 },
      { id: "mooncap-mushrooms", name: "mooncap mushrooms", challengeRank: 5, rewardMultiplier: 1.05 },
      { id: "amber-resin", name: "amber resin", challengeRank: 8, rewardMultiplier: 1.15 },
      { id: "mithral-shards", name: "mithral shards", challengeRank: 12, rewardMultiplier: 1.3 },
      { id: "star-metal", name: "star-metal fragments", challengeRank: 16, rewardMultiplier: 1.45 },
      { id: "planar-crystal", name: "planar crystals", challengeRank: 20, rewardMultiplier: 1.6 }
    ],
    rewardMultiplier: 0.8,
    rewards: [
      { minimumPartyLevel: 1, maximumPartyLevel: 4, baseCopper: 175 },
      { minimumPartyLevel: 5, maximumPartyLevel: 10, baseCopper: 1000 },
      { minimumPartyLevel: 11, maximumPartyLevel: 16, baseCopper: 5000 },
      { minimumPartyLevel: 17, maximumPartyLevel: 20, baseCopper: 25000 }
    ]
  },
  woodcutting: {
    label: "Woodcutting",
    actions: ["Chop", "Harvest", "Cut"],
    quantities: [
      { id: "few-cords", formula: "1d4", unit: "cords of", maximum: 4, minimumPartyLevel: 1, rewardMultiplier: 1 },
      { id: "many-cords", formula: "2d4", unit: "cords of", maximum: 8, minimumPartyLevel: 3, rewardMultiplier: 1.3 },
      { id: "rare-timber", formula: "2d6", unit: "bundles of", maximum: 12, minimumPartyLevel: 7, rewardMultiplier: 1.6 }
    ],
    targets: [
      { id: "firewood", name: "dry firewood", challengeRank: 1, rewardMultiplier: 0.8 },
      { id: "cedar", name: "cedar logs", challengeRank: 3, rewardMultiplier: 1 },
      { id: "bog-ironwood", name: "bog ironwood", challengeRank: 6, rewardMultiplier: 1.1 },
      { id: "shadow-ash", name: "shadow-ash timber", challengeRank: 10, rewardMultiplier: 1.25 },
      { id: "storm-oak", name: "storm-oak timber", challengeRank: 15, rewardMultiplier: 1.4 },
      { id: "worldroot", name: "worldroot heartwood", challengeRank: 20, rewardMultiplier: 1.6 }
    ],
    rewardMultiplier: 0.75,
    rewards: [
      { minimumPartyLevel: 1, maximumPartyLevel: 4, baseCopper: 150 },
      { minimumPartyLevel: 5, maximumPartyLevel: 10, baseCopper: 900 },
      { minimumPartyLevel: 11, maximumPartyLevel: 16, baseCopper: 4500 },
      { minimumPartyLevel: 17, maximumPartyLevel: 20, baseCopper: 22000 }
    ]
  },
  exploration: {
    label: "Exploration",
    actions: ["Locate", "Survey", "Map"],
    quantities: [
      { id: "one-site", formula: "", unit: "", maximum: 1, minimumPartyLevel: 1, rewardMultiplier: 1 },
      { id: "several-sites", formula: "1d4", unit: "sites near", maximum: 4, minimumPartyLevel: 5, rewardMultiplier: 1.25 }
    ],
    targets: [
      { id: "old-road", name: "the abandoned watchtower", challengeRank: 1, rewardMultiplier: 0.9 },
      { id: "collapsed-mine", name: "the collapsed silver mine", challengeRank: 4, rewardMultiplier: 1 },
      { id: "ruined-shrine", name: "the shrine hidden in the briarwood", challengeRank: 7, rewardMultiplier: 1.1 },
      { id: "flooded-vault", name: "the flooded vault beneath the old keep", challengeRank: 11, rewardMultiplier: 1.25 },
      { id: "skybridge", name: "the broken skybridge above the stormline", challengeRank: 15, rewardMultiplier: 1.4 },
      { id: "planar-gate", name: "the lost gate between planes", challengeRank: 20, rewardMultiplier: 1.6 }
    ],
    rewardMultiplier: 1,
    rewards: [
      { minimumPartyLevel: 1, maximumPartyLevel: 4, baseCopper: 200 },
      { minimumPartyLevel: 5, maximumPartyLevel: 10, baseCopper: 1250 },
      { minimumPartyLevel: 11, maximumPartyLevel: 16, baseCopper: 6000 },
      { minimumPartyLevel: 17, maximumPartyLevel: 20, baseCopper: 30000 }
    ]
  },
  escort: {
    label: "Escort",
    actions: ["Escort", "Safely deliver", "Guide"],
    quantities: [
      { id: "one-traveler", formula: "", unit: "", maximum: 1, minimumPartyLevel: 1, rewardMultiplier: 1 }
    ],
    targets: [
      { id: "courier-to-village", subject: "a wounded courier", destination: "the nearby village", challengeRank: 1, rewardMultiplier: 0.9 },
      { id: "healer-to-mines", subject: "a traveling healer", destination: "the miners' camp", challengeRank: 4, rewardMultiplier: 1 },
      { id: "envoy-to-fort", subject: "a guild envoy", destination: "the border fort", challengeRank: 7, rewardMultiplier: 1.1 },
      { id: "scholar-to-ruins", subject: "a field scholar", destination: "the sealed ruins", challengeRank: 11, rewardMultiplier: 1.25 },
      { id: "ambassador-to-capital", subject: "an allied ambassador", destination: "the capital through contested lands", challengeRank: 15, rewardMultiplier: 1.4 },
      { id: "planar-envoy", subject: "a planar envoy", destination: "the far-side citadel", challengeRank: 20, rewardMultiplier: 1.6 }
    ],
    rewardMultiplier: 1.1,
    rewards: [
      { minimumPartyLevel: 1, maximumPartyLevel: 4, baseCopper: 250 },
      { minimumPartyLevel: 5, maximumPartyLevel: 10, baseCopper: 1500 },
      { minimumPartyLevel: 11, maximumPartyLevel: 16, baseCopper: 7500 },
      { minimumPartyLevel: 17, maximumPartyLevel: 20, baseCopper: 35000 }
    ]
  }
};

export const GENERATION_CATEGORIES = Object.entries(QUEST_POOLS).map(([id, pool]) => ({
  id,
  label: pool.label
}));

export const URGENCY_OPTIONS = [
  { id: "standard", label: "Standard", rewardMultiplier: 1 },
  { id: "urgent", label: "Urgent", rewardMultiplier: 1.5 },
  { id: "emergency", label: "Emergency", rewardMultiplier: 2 }
];

export const CHALLENGE_OPTIONS = [
  { id: "routine", label: "Routine", budgetIndex: 0, targetOffset: -1, rewardMultiplier: 0.8 },
  { id: "standard", label: "Standard", budgetIndex: 1, targetOffset: 0, rewardMultiplier: 1 },
  { id: "high-risk", label: "High risk", budgetIndex: 2, targetOffset: 1, rewardMultiplier: 1.4 }
];

export const RULESET_OPTIONS = [
  { id: "2024", label: "2024 XP budget" },
  { id: "2014", label: "2014 XP thresholds" }
];

/** Per-character values; the party budget is summed from selected PCs' actual levels. */
export const XP_BUDGETS = {
  "2024": [
    null,
    [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500],
    [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100],
    [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700],
    [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800],
    [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]
  ],
  "2014": [
    null,
    [25, 50, 75, 100], [50, 100, 150, 200], [75, 150, 225, 400], [125, 250, 375, 500],
    [250, 500, 750, 1100], [300, 600, 900, 1400], [350, 750, 1100, 1700], [450, 900, 1400, 2100],
    [550, 1100, 1600, 2400], [600, 1200, 1900, 2800], [800, 1600, 2400, 3600], [1000, 2000, 3000, 4500],
    [1100, 2200, 3400, 5100], [1250, 2500, 3800, 5700], [1400, 2800, 4300, 6400], [1600, 3200, 4800, 7200],
    [2000, 3900, 5900, 8800], [2100, 4200, 6300, 9500], [2400, 4900, 7300, 10900], [2800, 5700, 8500, 12700]
  ]
};

export const ENCOUNTER_MULTIPLIERS_2014 = [1, 1.5, 2, 2.5, 3, 4];
export const REWARD_ROUNDING_COPPER = 5;
