---
date: 2026-10-05
branch: claude/free-walk-follow-camera
pr: 11
status: new
---

# Free movement, a follow camera, and buying only from the basket

## Got stuck on

- `npm run e2e` failed every test with `Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1243/...`; passed after rerunning with `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`, as CLAUDE.md says.

## Guessed

- The request needs a player, which only exists on the unmerged PR #10 branch; this branch is stacked on `claude/player-pathfinding-l102mo`.
- "Move freely, not just straight lines" read as: click any point, walk in straight lines at any angle (not cell by cell), not as keyboard/joystick control.
- "Can't look up towards the player" read as: camera tilt fixed (`minPolarAngle === maxPolarAngle` in `src/scene/FollowCamera.tsx`), turning around the player and zooming still allowed.
- A press and release more than 6px apart counts as a camera drag, not a tap (`TAP_SLOP_PX` in `src/scene/pointer.ts`); R3F only filters drags for missed clicks (`delta <= 2` in `events-*.esm.js`), not for `onClick` on hit objects.
- Being "next to" a crop now counts while passing by, since the player no longer stops on cells; DESIGN.md open question 9 updated.

## Repeated by hand

None

## Rule friction

- `max-params` (3) flagged `furthestInSight(isOpen, anchor, waypoints, first)` in `src/game/path.ts`; refactored to pass a slice and a sight-check closure.

## Noticed, out of scope

- `PlayerState` kept its saved shape (`x`, `z`, `path`, `walkStartedAt`), now holding fractional points, so `SAVE_VERSION` in `src/state/store.ts` was not bumped.

## Suggested change

- Have `playwright.config.ts` fall back to `/opt/pw-browsers/chromium` when the pinned headless shell is missing, so `npm run e2e` works without `PW_CHROMIUM_PATH` in cloud sessions.
