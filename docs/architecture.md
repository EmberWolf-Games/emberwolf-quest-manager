# Module architecture

The current implementation includes category-constrained procedural drafts, party roster settings, publication, party voting, GM-recorded quest outcomes, per-character guild cards and rank experience, and a shared party name. The initial pools, reward values, and guild XP rules are provisional; exact balancing and deadlines remain open. See [quest-generation.md](quest-generation.md), [guild-membership.md](guild-membership.md), and [SPECIFICATION.md](../SPECIFICATION.md).

## Planned boundaries

- **Quest generation** in `scripts/quest-generator.mjs` composes draft records from category-owned action, quantity, target, and reward arrays in `scripts/quest-pools.mjs`. It owns no storage or UI behavior.
- **Encounter feasibility** is kept inside the generation service but separate from text composition. Combat uses CR-band and XP-budget estimates; noncombat objectives use a comparative danger rating without assigning creature CR to inanimate objectives.
- **Quest data and persistence** own EWQM's records and state transitions. GM drafts, internal notes, generation metadata, and the private participant snapshot are kept in GM-owned JournalEntry records. One world setting contains only the public projection of published quests; another stores the GM-selected party actor IDs. The shared party name uses a world setting. Player votes are stored on the voting User document. Guild membership and experience live on each character's actor flags so multiple characters owned by one player progress independently.
- **Presentation** contains GM management and player-facing board/tracker interfaces. Player-visible views must not expose GM-only fields.

The Foundry entry point is `scripts/ewqm.mjs`. The board and generator workflows are documented in [quest-board.md](quest-board.md) and [quest-generation.md](quest-generation.md). Keep unapproved economy and encounter values configurable and labeled as provisional.
