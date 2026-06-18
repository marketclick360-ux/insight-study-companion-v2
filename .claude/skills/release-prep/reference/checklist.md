# Pre-release checklist

Run through these before tagging. Mark each pass/fail and surface failures.

## Contents
- Code health
- Versioning
- Docs
- Release hygiene

## Code health
- [ ] Tests pass (run the project's test command if one exists).
- [ ] Linter/typecheck is clean, or known failures are documented.
- [ ] No leftover debug logging, `TODO: remove`, or commented-out blocks in the
      diff since the last tag.

## Versioning
- [ ] Version number bumped in the project's manifest
      (`package.json`, `pyproject.toml`, `app.json`, etc.).
- [ ] The new version is greater than the last tag and follows the rules in
      [versioning.md](versioning.md).

## Docs
- [ ] CHANGELOG / release notes updated with the user-facing summary.
- [ ] README reflects any new flags, env vars, or setup steps.

## Release hygiene
- [ ] No secrets, API keys, or `.env` files staged in the release.
- [ ] Working tree is clean (everything intended is committed).
- [ ] Build succeeds if the project has a build step.
