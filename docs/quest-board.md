# Quest board — first implementation slice

## GM workflow

1. Optionally choose the player characters in the party roster and generate one or more quest drafts from category-constrained pools. The roster's average level is floored; generated drafts and their private generation notes appear only on the GM board.
2. Review and edit a generated draft, or write a commission manually. Save it as a draft.
3. Publish it to make the public posting visible to players and open a fresh party ballot.
4. Close a published quest to remove it from the player board without changing guild XP. After a party vote accepts a quest, the GM may mark it completed or failed to update each enrolled character saved in the quest's party snapshot. Accepted, declined, or closed quests may be reopened for a fresh ballot. Completed and failed outcomes are terminal so the same quest cannot award experience twice.

Generation combines a category's actions, quantities, targets, and reward table. The details and all provisional balancing values are in [quest-generation.md](quest-generation.md).

GM-only notes and draft data are stored in JournalEntry records inside a GM-owned archive folder. The `publishedQuests` world setting stores only published quest titles, public descriptions, guild-clerk notes, safe category/urgency/reward fields, deadline display data, statuses, and vote-round identifiers. Private notes, generation metadata, and the party actor IDs snapshotted when a quest is posted stay in GM-owned journal records. The separate `partyRoster` world setting stores the character IDs explicitly selected by the GM for generation and guild XP participation. The shared party name and provisional guild XP values are world settings. The optional Gemini relay URL is stored in a client-scoped setting on the GM browser; see [Gemini guild-clerk notes](gemini-clerk-notes.md) for key handling and setup.

## Party vote

- Each available quest has its own accept-or-decline ballot.
- Each Player or Trusted world user has one vote per ballot and may change it while the ballot is open.
- The electorate is every Player or Trusted user defined in the world, whether currently connected or not. Assistant Gamemasters and Gamemasters do not vote.
- A strict majority of the electorate resolves the ballot: more than half must vote the same way. The quest becomes Accepted or Declined by the party when that threshold is reached.
- A tie or an incomplete vote leaves the ballot open. Closing and reopening a quest starts a new ballot, so old votes do not carry over.

The GM-selected party roster is saved privately with a posting when it is published. Characters in that snapshot receive guild XP only if they joined the guild before the GM resolves the outcome.

The initial Guild XP defaults are +25 per enrolled character for a completed quest and −10 for a failed quest. A failed quest cannot reduce a character below 0 Guild XP. The GM can adjust both values in the guild settings section of the quest board.

## Current limits

- Procedural generation creates reviewable drafts only; it does not publish or balance them as final game rules.
- GM quest cards include a Delete action. The first click arms deletion for eight seconds; a second click on that quest permanently removes its archive record and public board entry.
- Reward and guild XP values are provisional and GM-adjustable. Challenge-tier reward tables are created as GM-only Foundry RollTables. Quest completion or failure is recorded manually by the GM.
- Some generated or GM-authored quests may have deadlines. They start on publication, count down only while the world is unpaused, use unpaused real time outside combat, and subtract 6 seconds per forward combat round while active combat is running. Rewinding a round does not restore time.
- An elapsed deadline is shown on the posting but does not automatically remove, close, or fail it. Closing, declining, completing, or failing stops the timer; reopening an unresolved quest resumes its remaining time. Board refresh and automatic disappearance rules are unchanged.
- The handwritten appearance uses system cursive fonts when available and a browser cursive fallback. No external font service is required.
- The board displays the guild's unsealed job thumbnail at about one quarter of its previous on-screen size (143 × 175 CSS pixels), with a compact gallery that remains visible while the GM settings pane scrolls independently. A party-accepted quest switches to the sealed thumbnail.
- Selecting a thumbnail opens a separate 550 × 700 Foundry window with the parchment displayed at 480 × 640 CSS pixels, sized to fit within the 1280 × 720 Foundry view used during review. Player windows include public details and party voting; GM windows may also show private GM notes.
- A GM-recorded completion or failure removes the quest from the player board and applies the configured XP award or penalty to enrolled characters from its saved party roster. Coin rewards are not automatically distributed, and no dnd5e quest tracker entry is created.

