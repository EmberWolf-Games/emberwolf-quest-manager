# AGENTS.md

Instructions for Codex and other coding agents working in this repository.

## Workflow
- Work on a short-lived branch unless explicitly told otherwise; submit a pull request into `main`.
- Read `README.md` and `SPECIFICATION.md` first.
- Respect existing EmberWolf Games repository automation and organizational policies.
- Keep changes focused and avoid unrequested features or dependency changes.
- Do not code unspecified game design decisions as settled rules: surface open questions to the project owner.

## Technical expectations
- Target Foundry VTT v14 and the currently compatible dnd5e system. Verify APIs and versions before implementing.
- Separate procedural quest generation, data/persistence, and UI.
- Keep encounter feasibility checks independent from quest text composition.
- Treat urgency independently from combat difficulty.
- Do not depend on Phil's Quest Tracker or Draxeyboi's Quest Journal.

## Validation
- Run documented build, test, and lint checks when the project acquires them.
- Report precise tests run and any checks not run.
- Avoid claims of Foundry v14 or dnd5e runtime compatibility without actual testing.

## Safety
- Never commit credentials, tokens, secrets, private keys, or populated `.env` files.
- Do not delete project data or deploy/publish without explicit authorization.
- Do not bypass security controls to satisfy tests.

## Project-specific setup
- Build: not yet defined (planning phase).
- Test: not yet defined.
- Lint: not yet defined.
- Development start: install in a separate Foundry v14 development world after initial module implementation.
- Deployment: GitHub release/module manifest process to be designed and approved.
- Architecture: see `SPECIFICATION.md`.
