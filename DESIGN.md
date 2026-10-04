# Toft — game design

## Island
- Each player has their own island with a grid. Crops and decorations are placed on it.
- Crops have different footprints (1×1, 1×2, …).

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
4. **Wheel slots with fewer than 6 crops unlocked, or more than 6?** Prototype: slot *i* belongs to the *i*-th unlocked crop; empty slots are locked and act like misses; crops beyond the 6th get no slot. `src/game/rules.ts`
5. **Exact curves** for spins per level, multiplier bonus and unlock levels. Prototype values live in `src/game/config.ts`.
