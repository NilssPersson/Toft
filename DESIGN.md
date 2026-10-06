# Toft — game design

## Island

- Each player has their own island with a grid. Crops and decorations are placed on it.
- Crops and decorations have different footprints (1×1, 1×2, …).

## Shop and build mode

- The shop button (top right) opens the shop as a panel from the left. Only one left panel is open at a time: opening the shop closes the ★ panel, and the other way round.
- The shop has two tabs, Crops and Decorations. Each item shows its size, its grow time (crops) and, while locked, the level it unlocks at. Locked items can't be picked.
- Picking an item closes the shop and starts build mode. The item appears as a grey ghost on the free cell nearest the one in front of the player (towards the camera), or in the middle of the island if nothing near is free. The faint grid shows only in build mode.
- The ghost snaps to the grid. Drag it (mouse or touch), tap a cell, or use the arrow keys or WASD (one cell, as seen on screen) to move it; R or the rotate button turns items that can turn. While the ghost is dragged the camera stays still, and in build mode taps never make the player walk. The ghost turns red where it can't go.
- Nothing is built until the player confirms with ✓ (or Enter); ✓ is disabled while the spot is invalid. ✕ (or Esc) leaves build mode. After a confirm, build mode stays on with the same item, and the ghost moves to the next free cell beside it, so rows of fences or crops are quick to lay.
- Building does not need the player nearby, and costs nothing yet.

## Decorations

- Stone wall, wooden fence, hedge and flower bed, all 1×1 for now. Walls, fences and hedges block walking; a flower bed can be walked over. Nothing can be built on any decoration.
- A fence can be turned. Neighbouring fences join up into one line; a fence on its own runs along its rotation.

## Player

- Each island has one player character. Clicking anywhere on open ground walks it to that exact point, in straight lines at any angle, not cell by cell.
- Crops and blocking decorations (walls, fences, hedges) are in the way; the player walks around them, keeping a little distance. A target it can't reach does nothing.
- The camera follows the player. Dragging turns it around the player at a fixed tilt, so it never looks up at the player; zooming in and out is allowed.
- Watering and harvesting need the player next to the crop. Clicking a crop walks the player to the nearest free cell beside it, then waters or harvests it on arrival.

## Crops

- Each crop has a growth requirement (some only need water, some need other crops) and a set grow time.
- Harvesting does not remove the crop. It needs its requirement fulfilled again to regrow.

## Progression and the wheel

- Levelling up takes a set number of wheel wins: 5 at level 1, rising each level.
- New crops unlock every 5 or 10 levels.
- The wheel has 8 spots: 6 crop slots (one per unlocked crop), 1 multiplier, 1 reset.
- Harvesting a crop fills its matching slot. You can spin with just one slot filled (1/8 odds) or wait to fill all six, which enables the multiplier.
- Outcomes:
  - Filled crop slot → win, remaining spins −1.
  - Unfilled crop slot or reset spot → progress for the current level resets to the full requirement.
  - Multiplier (only with all 6 filled) → remaining spins drop by more than 1, scaling with level.

## Multiplayer (later)

- Visit other players' islands and watch them play live (harvest, open gates). Visitors cannot build.
- Not built now, but the code is structured for it: all state changes are serialisable actions run through pure rules.

## Open questions

Assumptions the prototype makes that need a decision. Each is marked in code.

1. **Does a spin consume the filled slots?** Prototype: yes, all slots empty after any spin (otherwise there is no reason to wait and fill more). `src/game/wheel.ts`
2. **Landing on the multiplier before all 6 are filled?** Prototype: counts as a reset, which keeps the "1 filled = 1/8 odds" rule true. `src/game/wheel.ts`
3. **What does "needs another crop" mean in play?** (Consume a harvest? Be planted next to it?) Prototype: fulfilled the same way as water. `src/game/rules.ts`
4. **Wheel slots with fewer than 6 crops unlocked, or more than 6?** Prototype: slot _i_ belongs to the _i_-th unlocked crop; empty slots are locked and act like misses; crops beyond the 6th get no slot. `src/game/rules.ts`
5. **Exact curves** for spins per level, multiplier bonus and unlock levels. Prototype values live in `src/game/config.ts`.
6. **Does building need the player nearby?** Prototype: no. In build mode, confirming plants or builds where the ghost is without walking there, and taps move the ghost instead of the player. `src/state/build.ts`
7. **Old saves with a crop on the new wall or spawn cell?** Prototype: crops are never removed. A wall a crop covers is left out, and the player starts on the free cell nearest the spawn cell (nearest by steps, ties broken by lowest x, then lowest z). `src/game/migrate.ts`
8. **Planting on the player's path.** A crop can't go on the cell the player stands on, but it can go on a cell further along a walk in progress; the path was fixed when the walk started, so the player walks through it. Prototype: allowed. `src/game/placement.ts`
9. **When is the player "next to" a crop while walking?** Prototype: whenever the point it stands on is in a cell beside the crop, even while passing by. A new click mid-walk turns at once from where it is. `src/game/walk.ts`
10. **Saves from a smaller island.** The island grew from 12×12 to 16×16 cells. Prototype: every older save grows to the new size, with its crops, walls and player moved together so the old farm sits in the middle; an island is never shrunk. `src/game/migrate.ts`
11. **What does building cost?** There is no currency yet, so planting and building are free. `src/game/rules.ts`
12. **Where does the ghost start, and where does it go after a confirm?** Prototype: "in front of the player" is the cell between the player and the camera; the nearest free cell to it within 3 steps, else the island's centre. After a confirm, the first free cell beside it, trying the direction it faces first (right at rotation 0, then clockwise), else the nearest free cell. `src/state/build.ts`
13. **Old walls.** Saves from before decorations turn each wall into a stone wall on the same cell. `src/game/migrate.ts`
