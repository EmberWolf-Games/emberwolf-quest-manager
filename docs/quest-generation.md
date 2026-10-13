# Procedural quest generation

## Composition model

The generator lives in `scripts/quest-generator.mjs`; editable starter data lives in `scripts/quest-pools.mjs`. Each category keeps four compatible arrays together:

1. **Actions** — such as Collect, Chop, Hunt down, Locate, or Escort.
2. **Quantities** — an objective dice expression, its maximum workload, and a workload multiplier.
3. **Targets** — an SRD creature source for combat, or category-specific resources, sites, and escort pairs with a comparative danger rank.
4. **Rewards** — base copper-equivalent pay bands for party levels 1–4, 5–10, 11–16, and 17–20.

The selected category controls which arrays can be combined. `Any category` chooses among those compatible categories. A generated commission is saved as a private draft; the GM can edit its title and posting before publishing it. Generation never publishes a quest automatically.

## Party roster and level

The GM explicitly checks which world character actors belong to the party. The module does not infer party membership from ownership, tokens, or all actors in the world. It reads each selected dnd5e character's total level and calculates:

```text
party level = floor(sum of selected character levels / selected character count)
```

Multiclass levels are expected to be included in dnd5e's total character level. If no valid characters are selected, generation is refused.

## Feasibility estimates

Combat targets come from the dnd5e SRD monster compendium (`dnd5e.monsters`) and are limited to a numeric CR band within two of the floored party level. Creature count uses the largest possible quantity from its displayed formula for this estimate. A candidate is omitted if its estimated encounter XP exceeds the selected party budget.

- The 2024 budget uses the SRD's per-character Low, Moderate, and High XP budgets, summed across the selected characters ([2024 System Reference Document](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf)).
- The 2014 budget uses Easy, Medium, Hard, and Deadly thresholds, plus the published monster-count multiplier and party-size adjustment ([2014 Basic Rules, Building Combat Encounters](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/building-combat-encounters)). The generator maps Routine to Easy, Standard to Medium, and High risk to Deadly.

CR range and XP budget are separate filters. They do not evaluate terrain, surprise, character resources, monster abilities, or the full action economy. A generated combat draft is an estimate for GM review, not a safety guarantee.

Noncombat targets use `challengeRank`, an editable comparative danger rating kept separate from CR. Targets outside party level ±2 are omitted. The current data does not model specific ability checks, travel duration, hazards, or resource requirements.

## Dice, urgency, and payout

Dice formulas such as `2d4` remain visible in the objective; the generator does not roll or replace them with a quantity. The max value is used for the conservative combat budget estimate.

Standard, Urgent, and Emergency are kept independent from challenge selection. Urgency changes the posting's framing and applies its configured reward multiplier.

Reward calculations start with the selected category's party-level pay band in copper, then apply category, challenge, urgency, target-risk, and quantity multipliers. The selected challenge tier (Routine, Standard, or High Risk) is the reward-table key for this implementation; it is distinct from an adventurer's Guild Rank G–S. Each tier rolls a GM-only Foundry RollTable created in the `EWQM — Quest Reward Tables` folder. The generator creates a table only when one is missing; GM edits to existing table results are retained. Table results use a numeric multiplier such as `0.90× reward multiplier`. The tables are reusable and do not announce rolls in chat. Results are rounded to 5 CP and displayed in GP/SP/CP denominations (100 CP = 10 SP = 1 GP).

The starting reward tables are:

| Challenge tier | Possible table multipliers (weights) |
| --- | --- |
| Routine | 0.8× (35), 0.9× (35), 1.0× (20), 1.1× (10) |
| Standard | 0.85× (15), 0.95× (30), 1.0× (35), 1.1× (15), 1.2× (5) |
| High Risk | 0.9× (10), 1.0× (20), 1.15× (30), 1.3× (25), 1.5× (15) |

These are starter odds and payout adjustments, not final economy rules. Multipliers stack with the category, urgency, target, quantity, and encounter-risk adjustments. The generator records the roll and the full multiplier breakdown in the GM-only generation notes.

## Time limits

Pool entries may include a deadline duration and a reason. Initial time-limited examples include medicine delivery, food relief, and locating a missing herbalist. A GM can also set or clear a duration and edit its reason when authoring a commission; the allowed range is 0–168 hours.

A deadline begins when its draft is published. It advances only while the world is unpaused. Outside active combat it counts unpaused real time; during active combat, each forward combat-round advance subtracts six seconds, matching the requested round economy. Rewinding a round does not restore time. Switching between real-time and round-based modes preserves the remaining duration, and pausing freezes it.

When the countdown reaches zero, the posting remains on the board and the GM decides whether the quest was completed or failed. An elapsed deadline does not automatically hide, close, fail, or award Guild XP to a quest. Closing, declining, completing, or failing a quest stops its countdown; reopening an unresolved quest resumes its saved remaining time. These rules intentionally leave quest refresh and disappearance behavior unchanged.

## Owner-confirmed goals and implementation defaults

The composable pools, party-level calculation, approximate CR band, CP/SP/GP payouts, and three urgency classes are project requirements. The exact pool schema, starter examples, challenge labels and mappings, reward tables, multipliers, displayed-dice choice, and ruleset default are implementation choices that remain open to balancing. The starting guild XP defaults award +25 XP per enrolled character for a completed quest and deduct 10 XP per enrolled character for a failed quest, with a floor of 0; the GM can adjust both on the quest board. Rank thresholds are separately adjustable in module settings. Whether reward-table tiers should eventually map to Guild Rank G–S remains open for balancing.

