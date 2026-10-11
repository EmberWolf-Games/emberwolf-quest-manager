# EmberWolf Quest Manager (EWQM)

A standalone, open-source Adventurer's Guild and procedural quest management module for **Foundry Virtual Tabletop v14** and the **dnd5e** game system.

> **Status: framework skeleton.** The repository now contains a Foundry module manifest and a minimal initialization entry point. Quest generation, storage, and user interfaces are not implemented. Compatibility must be validated against Foundry and dnd5e before it is claimed as verified.

## Goals

- Generate quests from extensible, compatible pools of actions, quantities, creatures, resources, NPCs, and destinations.
- Calculate party level as the floor of the average level of explicitly selected player characters.
- Generate feasible challenges, generally within a configurable ±2 challenge band, while accounting for monster quantities and encounter composition.
- Calculate proportionate rewards across copper, silver, and gold.
- Distinguish **Standard**, **Urgent**, and **Emergency** commissions without treating urgency as combat difficulty.
- Offer an EWQM-owned quest board, storage, GM-facing management, and player-facing tracking.
- Keep quest generation, encounter feasibility, persistence, and presentation separate.

Examples such as `Collect 2d4 Silver Ore`, `Kill 2d6 Goblins`, and `Escort a named NPC` illustrate template composition; generated encounters still require feasibility checks.

## Project documentation

- [Initial functional specification](SPECIFICATION.md)
- [Architecture boundaries](docs/architecture.md)
- [Versioning and releases](VERSIONING.md)
- [Coding agent guidance](AGENTS.md)

## Development install

Copy `module.json`, `scripts/`, `README.md`, and `LICENSE` into a folder named `emberwolf-quest-manager` under Foundry's user data `Data/modules/` directory. Reload or re-enter the world so Foundry discovers the package, then enable it through **Settings → Manage Modules**. The module is intentionally not activated by this setup.

No build, test, or lint commands are defined yet.

## Releases and updates

The package uses `R.M.m.b` versions; see [VERSIONING.md](VERSIONING.md). After a matching version change is merged to `main`, pushing the exact version tag runs `.github/workflows/release.yml`. The workflow publishes a module ZIP and a Foundry manifest. Install or update using this stable manifest URL:

`https://raw.githubusercontent.com/EmberWolf-Games/emberwolf-quest-manager/main/module.json`

## License

MIT License. See [LICENSE](LICENSE). Copyright © 2026 EmberWolf Games.
