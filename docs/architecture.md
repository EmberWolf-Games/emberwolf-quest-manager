# Module architecture

The initial code is a loadable package shell only. Quest generation, persistence, and presentation are not implemented yet. Open design questions in [SPECIFICATION.md](../SPECIFICATION.md) remain open until the project owner settles them.

## Planned boundaries

- **Quest generation** composes drafts from compatible action, quantity, target, and destination pools. It owns no storage or UI behavior.
- **Encounter feasibility** evaluates combat and noncombat challenge feasibility independently from quest wording. Noncombat objectives receive a danger assessment without assigning creature CR to inanimate objectives.
- **Quest data and persistence** own EWQM's records and state transitions. Party membership must be explicit; arbitrary world actors are never included automatically.
- **Presentation** contains GM management and player-facing board/tracker interfaces. Player-visible views must not expose GM-only fields.

The Foundry entry point is `scripts/ewqm.mjs`. Add each subsystem behind these boundaries when its design has been agreed and its behavior can be validated.
