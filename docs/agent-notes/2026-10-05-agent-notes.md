---
date: 2026-10-05
branch: claude/agent-notes
pr:
status: new
---

# Add per-PR agent notes and a PR template

## Got stuck on

None

## Guessed

- The task asked for "any markdown or lint checks" on the new files; the repo has none for Markdown besides Prettier (`eslint .` only covers JS/TS/Astro), so Prettier is the only check run on `docs/`.
- "Random suffix" in branch names wasn't defined; assumed a last segment mixing letters and digits (`-fln5i6`) and wrote that into `docs/agent-notes/README.md`.
- The format puts a placeholder after `pr:` but the workflow says to leave it empty; `_template.md` has `pr:` empty.

## Repeated by hand

- Built the note's file name from the date and branch, and copied `_template.md`, by hand; a script could do both.
- Checked by hand that `docs/` stays out of the build (`grep -ri agent-notes dist/` after `npm run build`); `check:dist` only looks for `__toft`.
- `git checkout -B claude/agent-notes origin/main` set the branch to track `origin/main`; the first push needs `-u origin claude/agent-notes` to fix the upstream.

## Rule friction

- "The note is the last commit" and "fill in `pr:` in a follow-up commit" contradict each other; read as "last commit before the PR is opened".

## Noticed, out of scope

- `.github/pull_request_template.md` is not applied to PRs opened through the GitHub API, so agents must copy its headings themselves (noted in `CLAUDE.md`, not enforced).

## Suggested change

- Add `npm run note` (e.g. `scripts/newAgentNote.ts`) that creates `docs/agent-notes/<date>-<short-name>.md` from `_template.md` with `date` and `branch` filled in from `git`.
- Extend `check:dist` in `package.json` to also fail if `dist/` contains `agent-notes` or `status: new`, so a misplaced `docs/` folder can't reach the deploy.
- Word the `CLAUDE.md` order as "the note is the last commit before opening the PR; the only commit after it fills in `pr:`".
