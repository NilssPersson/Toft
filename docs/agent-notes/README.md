# Agent notes

Every PR an agent opens carries one short note about friction in the agent workflow: what got in the way, what had to be guessed, what was done by hand. The notes exist to find patterns, so `CLAUDE.md`, the lint rules, the scripts, the test helpers and the skills can be improved. They are not a changelog and not a summary of the PR.

A separate review reads the notes with `status: new`, turns recurring items into changes, and sets them to `status: reviewed`. Only that review changes `status`.

## File name

`docs/agent-notes/YYYY-MM-DD-<short-name>.md`

- `YYYY-MM-DD` is the day the PR is opened. Date first, so the files sort chronologically.
- `<short-name>` is the branch name without the `claude/` prefix and without any random suffix, in kebab-case. Branch `claude/edge-anchored-hud` opened on 5 October 2026 gives `2026-10-05-edge-anchored-hud.md`; `claude/landscape-orientation-phones-fln5i6` drops `-fln5i6`. A random suffix is a last segment that mixes letters and digits and isn't a word, added by the tooling that named the branch.

## Format

Copy [`_template.md`](_template.md):

```markdown
---
date: YYYY-MM-DD
branch: <full branch name>
pr: <PR number, filled in after the PR is opened>
status: new
---

# <PR title>

## Got stuck on

## Guessed

## Repeated by hand

## Rule friction

## Noticed, out of scope

## Suggested change
```

What goes under each heading:

- **Got stuck on**: what failed or needed several attempts, and what fixed it.
- **Guessed**: where `CLAUDE.md`, `DESIGN.md` or the code was unclear, and what was assumed.
- **Repeated by hand**: manual steps a script, skill or helper could do.
- **Rule friction**: a lint rule or instruction that got in the way or conflicted with another.
- **Noticed, out of scope**: tech debt or bugs seen but not fixed, with file paths.
- **Suggested change**: at most three concrete edits to `CLAUDE.md`, the lint config, scripts, test helpers or skills that would have prevented the items above.

## Writing rules

- **Only concrete items, each with evidence**: the file, command, error message or rule name. No general advice, no praise, no summary of the PR itself.
- **Write "None"** under a heading when there's nothing. An empty note is better than filler.
- **Keep it short**: bullets, roughly one line each.
- **Every agent PR gets a note**, including small ones.

## Workflow

1. Write the note as the last commit on the branch, after all checks pass, with `pr:` left empty.
2. Open the PR. Its description links to the note file.
3. Fill in `pr:` with the PR number in a small follow-up commit.

Never edit another PR's note.
