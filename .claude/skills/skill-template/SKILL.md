---
name: skill-template
description: Starter template showing how to structure a complex skill with progressive disclosure. Copy this folder to create a new skill; not meant to be invoked directly.
user-invocable: false
disable-model-invocation: true
---

# Skill Template

> This file is the **navigation hub**. Keep it short. Anything long or
> conditional belongs in `reference/` (loaded on demand) or `scripts/`
> (executed, output-only). Delete these quote blocks when you copy it.

## When to use

State, in one or two lines, the situation this skill handles. Mirror the
triggers you put in the `description` frontmatter above.

## Steps

1. Do the first thing. Inline only the instructions that are *always* needed.
2. For the detailed rules, read [reference/DETAILS.md](reference/DETAILS.md).
   > Reference files load only when Claude opens them — that's the whole point.
   > Keep them one level deep so they're read in full.
3. Run deterministic work as a script instead of inlining logic:

   ```bash
   python ${CLAUDE_SKILL_DIR}/scripts/example.py "$ARGUMENTS"
   ```

   > `${CLAUDE_SKILL_DIR}` resolves to this skill's folder. Only the script's
   > printed output enters context, not its source.

## Output

Describe what "done" looks like so Claude knows when to stop.
