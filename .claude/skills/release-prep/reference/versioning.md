# Versioning rules

How to choose the next version (semantic versioning: `MAJOR.MINOR.PATCH`).

## Contents
- Pick the bump
- Pre-1.0 projects
- Tag format

## Pick the bump
Inspect commit messages since the last tag:

- **MAJOR** — any breaking change to behavior, API, or data format. Signals:
  `BREAKING CHANGE`, `!` after the type (e.g. `feat!:`), removed/renamed public
  surface.
- **MINOR** — new functionality, backward compatible. Signals: `feat:`.
- **PATCH** — bug fixes and internal-only changes. Signals: `fix:`, `chore:`,
  `refactor:`, `docs:`.

When commits are mixed, take the **highest** applicable bump.

## Pre-1.0 projects
While the version is `0.x`, avoid MAJOR bumps; treat breaking changes as MINOR
(`0.4.0 → 0.5.0`) and everything else as PATCH, unless the user wants to cut
`1.0.0`.

## Tag format
Tags are `v` + version, e.g. `v1.4.0`. The "last tag" is the most recent tag
matching `v*`.
