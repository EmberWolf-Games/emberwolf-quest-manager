# AGENTS.md

This file defines the default operating rules for coding agents working in this repository.

## Workflow

- Work on a short-lived branch unless explicitly told otherwise.
- Prefer a pull request into `main`.
- Keep changes focused; avoid unrelated refactors.
- Read repository documentation before modifying architecture or deployment behavior.

## Validation

Before declaring work complete:

- Run the repository's documented build command.
- Run applicable tests.
- Run applicable lint/static-analysis checks.
- Report anything that could not be validated.

## Safety

- Never commit passwords, tokens, API keys, private keys, production credentials, or populated `.env` files.
- Do not delete production data, repositories, cloud resources, or deployment targets without explicit authorization.
- Do not deploy to production unless explicitly requested.
- Do not weaken security controls merely to make a test pass.

## Project-specific setup

Replace this section when the project is initialized with:

- Build command:
- Test command:
- Lint/check command:
- Development start command:
- Deployment command/process:
- Important architecture notes: