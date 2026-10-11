# EmberWolf Quest Manager (EWQM)

A standalone, open-source Adventurer's Guild and procedural quest management module for **Foundry Virtual Tabletop v14** and the **dnd5e** game system.

> **Status: prototype / planning.** This repository does not yet contain a working Foundry module. Compatibility must be validated against the current dnd5e release during development.

## Goals
- Generate quests from extensible, compatible pools of actions, quantities, creatures, resources, NPCs, and destinations.
- Calculate party level as the floor of the average level of the selected player characters.
- Generate feasible challenges, generally within a configurable ±2 challenge band, while accounting for monster quantities and encounters.
- Calculate proportionate rewards across copper, silver, and gold.
- Distinguish **Standard**, **Urgent**, and **Emergency** commissions with differing deadlines, stakes, and rewards.
- Offer a native guild quest board, quest storage, GM-facing management, and player-facing quest tracking.
- Keep generation logic independent from the UI and persistence layers.

## Examples
- Collect 2d4 Silver Ore
- Kill 2d6 Goblins
- Escort a named NPC to a named destination

Examples illustrate template composition, **not automatically approved encounters**. Generated encounters must pass feasibility rules.

## Project documentation
- [Initial functional specification](SPECIFICATION.md)
- [Coding agent guidance](AGENTS.md)

## Development
Implementation will be carried out with **OpenAI Codex**. Follow the organization-specific `AGENTS.md` guidelines, work on a branch, and open a pull request. No builds, tests, or installation packages are available yet.

## License
MIT License. See [LICENSE](LICENSE). Copyright © 2026 EmberWolf Games.
