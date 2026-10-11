# Quest board — first implementation slice

## GM workflow

1. Write a title, public posting, and optional GM only notes.
2. Save the commission as a draft. Drafts appear only in the GM board.
3. Publish it to make the public posting visible to players and open a fresh party ballot.
4. Close a published quest to remove it from the player board. A GM may reopen a closed, accepted, or declined quest; reopening starts a fresh ballot.

GM only notes and draft data are stored in JournalEntry records inside a GM-owned archive folder. The shared world setting stores only published quest titles, public descriptions, statuses, and vote-round identifiers. It never stores private notes or draft text.

## Party vote

- Each available quest has its own accept-or-decline ballot.
- Each Player or Trusted world user has one vote per ballot and may change it while the ballot is open.
- The electorate is every Player or Trusted user defined in the world, whether currently connected or not. Assistant Gamemasters and Gamemasters do not vote.
- A strict majority of the electorate resolves the ballot: more than half must vote the same way. The quest becomes Accepted or Declined by the party when that threshold is reached.
- A tie or an incomplete vote leaves the ballot open. Closing and reopening a quest starts a new ballot, so old votes do not carry over.

These rules are the initial implementation choice for a party-wide vote. Explicit party roster selection and ballots spanning several quest choices remain open design questions.

## Current limits

- Quest text is written by the GM; procedural generation is not included.
- Rewards, deadlines, quest refresh, and automatic completion or failure are not included.
- The handwritten appearance uses system cursive fonts when available and a browser cursive fallback. No external font service is required.
- The vote result is limited to the board status. It does not create a dnd5e quest tracker entry or distribute rewards.
