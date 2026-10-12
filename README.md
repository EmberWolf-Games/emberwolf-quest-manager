# EmberWolf Quest Manager (EWQM)

A standalone, open-source Adventurer's Guild and procedural quest management module for **Foundry Virtual Tabletop v14** and the **dnd5e** game system.

> **Status: early implementation.** The module includes a GM-facing procedural draft generator, quest publication and closure, a parchment-style player board, and party voting. Generator pools, feasibility estimates, and payouts use provisional starter values. Deadlines are not implemented. Compatibility is being checked in Foundry v14 with dnd5e.

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
- [Quest board behavior](docs/quest-board.md)
- [Procedural generation and provisional balancing](docs/quest-generation.md)
- [Optional Gemini guild-clerk notes](docs/gemini-clerk-notes.md)
- [Versioning and releases](VERSIONING.md)
- [Coding agent guidance](AGENTS.md)

## Development install

Copy `module.json`, `scripts/`, `templates/`, `styles/`, `assets/`, `README.md`, and `LICENSE` into a folder named `emberwolf-quest-manager` under Foundry's user data `Data/modules/` directory. Reload the world after updating files. In the canvas, open the scroll icon in the token controls to access the quest board.

No build, test, or lint commands are defined yet. See the quest board behavior document for the current vote rules and limits.

## Releases and updates

The package uses `R.M.m.b` versions; see [VERSIONING.md](VERSIONING.md). After a matching version change is merged to `main`, pushing the exact version tag runs `.github/workflows/release.yml`. The workflow publishes a module ZIP and a Foundry manifest. Install or update using this stable manifest URL:

`https://raw.githubusercontent.com/EmberWolf-Games/emberwolf-quest-manager/main/module.json`

## License

MIT License. See [LICENSE](LICENSE). Copyright © 2026 EmberWolf Games.
