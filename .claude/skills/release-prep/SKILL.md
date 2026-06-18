---
name: release-prep
description: Prepares a release — determines the next version, drafts changelog entries from git history, and lists pre-release checks. Use when asked to cut a release, ship, bump the version, draft release notes, or tag a version.
argument-hint: [major|minor|patch]
allowed-tools: Bash(git *) Bash(python *)
---

# Release Prep

Prepare a clean, consistent release for any project.

## 1. Decide the version bump

If the user didn't say `major` / `minor` / `patch`, infer it from the commits
since the last tag using the rules in
[reference/versioning.md](reference/versioning.md), then confirm with the user.

## 2. Draft the changelog

Generate grouped changelog entries from git history since the last tag:

```bash
python ${CLAUDE_SKILL_DIR}/scripts/changelog.py "$ARGUMENTS"
```

The script prints Markdown grouped by type (Features / Fixes / Other). Edit it
for readability — drop noise, merge duplicates, keep it user-facing.

## 3. Run the pre-release checklist

Walk the project against [reference/checklist.md](reference/checklist.md).
Only read it now — it stays on disk until this step.

## 4. Summarize

Report back: the chosen version, the polished changelog, and any checklist items
that failed or need the user's attention. Do **not** tag or push unless asked.
