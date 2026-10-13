# EmberWolf Quest Manager — Initial Requirements

## Target platform
- Standalone Foundry VTT **v14** module supporting the newest **compatible** dnd5e system build.
- Do not depend on Phil's Quest Tracker or Draxeyboi's Quest Journal.
- Confirm actual API/system compatibility during implementation; don't assert compatibility merely from a manifest.

## Procedural generation
Combine entries from expandable data pools rather than selecting only prewritten quests.
- Actions: Collect, Chop, Kill, Locate, Escort, etc.
- Quantity: dice expressions such as `2d4`, `2d6`, or no quantity when inapplicable.
- Targets: monster/creature names or types, resources, objects, actors, destination locations.
- Select dependent pools based on the action; disallow nonsensical combinations.
- Example results: `Collect 2d4 Silver Ore`, `Kill 2d6 Goblins`, `Escort [actorname] to [locationname]`.

The first implementation uses category-owned action, quantity, target, and reward arrays. The GM selects the roster explicitly. Combat is filtered by an approximate ±2 CR band and an XP-budget estimate; noncombat targets use a separate comparative danger rank. Generated quests are saved as GM-only drafts for review. The implementation and its provisional values are described in [docs/quest-generation.md](docs/quest-generation.md).

## Party level and feasible CR
Compute:
`partyLevel = Math.floor(sum(characterLevels) / partyCharacterCount)`.
- Explicitly define party membership; never include arbitrary world actors automatically.
- Current implementation: Gamemasters choose character actors in a world-level roster; only selected characters count.
- Refuse generation if party roster is empty.
- Permit combat quests roughly one or two CR ranks above/below the party level, limited to valid CR entries, including fractional CR where needed, and estimate feasibility using quantity and XP budget.
- Creature CR is **not** equivalent to encounter difficulty. Check group size, encounter composition, action economy, and objective quantity.
- For gathering, escort, location and other noncombat quests, assign a comparable danger/difficulty assessment without inventing monster CR for inanimate objects.
- Always enforce feasibility limits; allow difficult quests with elevated risk and reward.

## Economy
- Scale rewards to actual difficulty, risk, objective complexity, and urgency.
- Represent payments in **CP, SP, GP**; 1 GP = 10 SP = 100 CP.
- Calculate in copper-equivalent value and convert to display denominations.
- Reward scales and rounding policy must be configurable/testable. Current payout tables, multipliers, and 5 CP rounding are provisional balancing defaults, not final economy rules.

## Urgency classes
Urgency remains separate from difficulty:
| Class | Intended behavior | Tentative base reward multiplier |
| --- | --- | ---: |
| Standard | Routine request, flexible/absent deadline | 1.0x |
| Urgent | Time-sensitive objective, accelerated consequence | 1.5x |
| Emergency | Immediate crisis, severe consequence | 2.0x |

These multipliers are starting design assumptions; refine via balancing. Higher urgency need not imply stronger enemies or impossible quantities.

## Native tracker and board
- EWQM-owned quest persistence, not another quest tracker's private data structure.
- GM can generate, edit, review, publish, close, and manage quests.
- Public board/quest display must not reveal GM-only data.
- Model distinct available/accepted/completed/failed states; final state transitions, claims, permissions, and visibility will be specified with implementation. Optional deadlines begin when published, count unpaused real time outside combat or six seconds per forward round during active combat, and show an elapsed state without automatically hiding or failing the posting.
- Keep the generator, persistence, and presentation decoupled.

## Initial quest-board rules
- GM-authored quests begin as drafts and have a public posting plus optional GM-only notes.
- Drafts and GM-only notes are stored in GM-owned JournalEntry records. The shared setting contains only safe public fields for published quests.
- Each published quest has an independent party-wide Accept or Decline ballot. Every Player or Trusted world user gets one changeable vote; Assistant Gamemasters and Gamemasters do not vote.
- A strict majority of all Player or Trusted world users resolves a ballot. Ties and incomplete votes remain open. Closing and reopening a quest starts a fresh ballot.
- This voter group is an initial implementation choice. Explicit roster UI and use of dnd5e's total character level are also implementation choices and should be checked against the active system build. Whether a ballot should select among multiple simultaneous commissions remains open.

## Open design questions (do not assume answers)
- Multiclass total-level behavior should be confirmed against the active dnd5e build.
- Mapping adventurer Guild Rank G–S to party level, CR, and a quest's reward tier.
- Data sources for enemies, NPCs, resources, and destinations.
- Quest-count and refresh schedule.
- Time/calendar integration beyond the implemented unpaused real-time and combat-round deadline clocks.
- Reward base tables, quantity scaling, balance caps and XP handling.
- UI design and reward distribution/claim process.

## Development guardrails
- Write compatibility-focused, testable code in subsequent Codex PRs.
- Do not assume unsupported v14 or dnd5e APIs.
- Don't package or claim a working release until tested in Foundry.

