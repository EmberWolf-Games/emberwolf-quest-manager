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

Standard, Urgent, and Emergency are kept independent from challenge selection. Urgency changes the posting's framing and applies its configured reward multiplier. No world-time deadline or automatic expiration is created.

Reward calculations start with the selected category's party-level pay band in copper, then apply category, challenge, urgency, target-risk, and quantity multipliers. Results are rounded to 5 CP and displayed in GP/SP/CP denominations (100 CP = 10 SP = 1 GP). The reward arrays and all multipliers in this first generator are provisional balancing defaults. They are editable in `quest-pools.mjs` and are not approved final economy rules.

## Owner-confirmed goals and implementation defaults

The composable pools, party-level calculation, approximate CR band, CP/SP/GP payouts, and three urgency classes are project requirements. The exact pool schema, starter examples, challenge labels and mappings, reward tables, multipliers, displayed-dice choice, and ruleset default are implementation choices that remain open to balancing. Exact deadlines, refresh schedules, and automatic quest lifecycle changes remain unimplemented.
