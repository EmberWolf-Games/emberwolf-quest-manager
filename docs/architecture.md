# Module architecture

The first implementation slice adds quest drafting, publication, party voting, and closure. Procedural generation, reward balancing, and deadlines remain unimplemented. Open design questions in [SPECIFICATION.md](../SPECIFICATION.md) remain open until the project owner settles them.

## Planned boundaries

- **Quest generation** composes drafts from compatible action, quantity, target, and destination pools. It owns no storage or UI behavior.
- **Encounter feasibility** evaluates combat and noncombat challenge feasibility independently from quest wording. Noncombat objectives receive a danger assessment without assigning creature CR to inanimate objectives.
- **Quest data and persistence** own EWQM's records and state transitions. GM drafts and internal notes are kept in GM-owned JournalEntry records. A world setting contains only the public projection of published quests; player votes are stored on the voting User document.
- **Presentation** contains GM management and player-facing board/tracker interfaces. Player-visible views must not expose GM-only fields.

The Foundry entry point is `scripts/ewqm.mjs`. The current board is documented in [quest-board.md](quest-board.md). Add each subsystem behind these boundaries when its design has been agreed and its behavior can be validated.
