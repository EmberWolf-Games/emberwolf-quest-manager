# Quest board — first implementation slice

## GM workflow

1. Optionally choose the player characters in the party roster and generate one or more quest drafts from category-constrained pools. The roster's average level is floored; generated drafts and their private generation notes appear only on the GM board.
2. Review and edit a generated draft, or write a commission manually. Save it as a draft.
3. Publish it to make the public posting visible to players and open a fresh party ballot.
4. Close a published quest to remove it from the player board. A GM may reopen a closed, accepted, or declined quest; reopening starts a fresh ballot.

Generation combines a category's actions, quantities, targets, and reward table. The details and all provisional balancing values are in [quest-generation.md](quest-generation.md).

GM only notes and draft data are stored in JournalEntry records inside a GM-owned archive folder. The `publishedQuests` world setting stores only published quest titles, public descriptions, safe category/urgency/reward fields, statuses, and vote-round identifiers. Private notes, generation metadata, and draft text stay in GM-owned journal records. The separate `partyRoster` setting stores the character IDs explicitly selected by the GM for generation.

## Party vote

- Each available quest has its own accept-or-decline ballot.
- Each Player or Trusted world user has one vote per ballot and may change it while the ballot is open.
- The electorate is every Player or Trusted user defined in the world, whether currently connected or not. Assistant Gamemasters and Gamemasters do not vote.
- A strict majority of the electorate resolves the ballot: more than half must vote the same way. The quest becomes Accepted or Declined by the party when that threshold is reached.
- A tie or an incomplete vote leaves the ballot open. Closing and reopening a quest starts a new ballot, so old votes do not carry over.

These rules are the initial implementation choice for a party-wide vote. Explicit party roster selection and ballots spanning several quest choices remain open design questions.

## Current limits

- Procedural generation creates reviewable drafts only; it does not publish or balance them as final game rules.
- Reward values are provisional. Deadlines, quest refresh, and automatic completion or failure are not included.
- The handwritten appearance uses system cursive fonts when available and a browser cursive fallback. No external font service is required.
- The vote result is limited to the board status. It does not create a dnd5e quest tracker entry or distribute rewards.
