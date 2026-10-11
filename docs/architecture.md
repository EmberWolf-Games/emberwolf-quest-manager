# Module architecture

The current implementation includes category-constrained procedural drafts, party roster settings, publication, party voting, and closure. The initial pools and reward values are provisional; exact balancing and deadlines remain open. See [quest-generation.md](quest-generation.md) and [SPECIFICATION.md](../SPECIFICATION.md).

## Planned boundaries

- **Quest generation** in `scripts/quest-generator.mjs` composes draft records from category-owned action, quantity, target, and reward arrays in `scripts/quest-pools.mjs`. It owns no storage or UI behavior.
- **Encounter feasibility** is kept inside the generation service but separate from text composition. Combat uses CR-band and XP-budget estimates; noncombat objectives use a comparative danger rating without assigning creature CR to inanimate objectives.
- **Quest data and persistence** own EWQM's records and state transitions. GM drafts, internal notes, and generation metadata are kept in GM-owned JournalEntry records. One world setting contains only the public projection of published quests; a separate setting stores the GM-selected party actor IDs. Player votes are stored on the voting User document.
- **Presentation** contains GM management and player-facing board/tracker interfaces. Player-visible views must not expose GM-only fields.

The Foundry entry point is `scripts/ewqm.mjs`. The board and generator workflows are documented in [quest-board.md](quest-board.md) and [quest-generation.md](quest-generation.md). Keep unapproved economy and encounter values configurable and labeled as provisional.
