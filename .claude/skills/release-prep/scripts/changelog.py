#!/usr/bin/env python3
"""Draft a Markdown changelog from git history since the last v* tag.

Output goes to stdout for Claude to read and polish. Nothing here is loaded
into context except what it prints — this is the "scripts run, they don't load"
half of progressive disclosure.

Usage:
    python changelog.py [major|minor|patch]
"""

from __future__ import annotations

import re
import subprocess
import sys

# Conventional-commit type -> changelog section.
SECTIONS = [
    ("Features", ("feat",)),
    ("Fixes", ("fix",)),
    ("Other", ("refactor", "perf", "docs", "chore", "build", "ci", "test", "style")),
]
_TYPE = re.compile(r"^(?P<type>\w+)(?:\([^)]*\))?(?P<bang>!)?:\s*(?P<desc>.+)$")


def git(*args: str) -> str:
    return subprocess.run(
        ["git", *args], capture_output=True, text=True, check=False
    ).stdout.strip()


def last_tag() -> str:
    tag = git("describe", "--tags", "--abbrev=0", "--match", "v*")
    return tag


def commits_since(tag: str) -> list[str]:
    rng = f"{tag}..HEAD" if tag else "HEAD"
    out = git("log", rng, "--no-merges", "--pretty=format:%s")
    return [line for line in out.splitlines() if line.strip()]


def main() -> int:
    bump = sys.argv[1] if len(sys.argv) > 1 else None
    tag = last_tag()
    commits = commits_since(tag)

    if not commits:
        print(f"_No commits since {tag or 'the beginning of history'}._")
        return 0

    buckets: dict[str, list[str]] = {name: [] for name, _ in SECTIONS}
    breaking: list[str] = []

    for subject in commits:
        match = _TYPE.match(subject)
        desc = match.group("desc") if match else subject
        ctype = match.group("type").lower() if match else ""
        if match and match.group("bang"):
            breaking.append(desc)
        placed = False
        for name, types in SECTIONS:
            if ctype in types:
                buckets[name].append(desc)
                placed = True
                break
        if not placed and not (match and match.group("bang")):
            buckets["Other"].append(subject)

    header = f"## Next release ({bump})" if bump else "## Next release"
    print(header)
    print(f"\n_Changes since {tag or 'first commit'}: {len(commits)} commit(s)._\n")

    if breaking:
        print("### ⚠️ Breaking changes")
        for item in breaking:
            print(f"- {item}")
        print()

    for name, _ in SECTIONS:
        items = buckets[name]
        if items:
            print(f"### {name}")
            for item in items:
                print(f"- {item}")
            print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
