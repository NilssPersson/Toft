import type { ReactElement } from 'react';
import { currentRecipe } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { CropIconBadge } from './CropIcon.tsx';

/**
 * Beside the ★: the crops the next spin needs, each on white that turns gold once collected.
 * Hidden while the wheel itself is open.
 */
export function RecipeStrip(): ReactElement {
  const progression = useStore((state) => state.game.progression);
  const filled = useStore((state) => state.game.wheel.filled);
  const isWheelOpen = useStore((state) => state.openPanel === 'wheel');
  return (
    <ul className="recipe-strip" aria-label="Next spin needs" hidden={isWheelOpen}>
      {currentRecipe(progression).map((cropId, slot) => (
        <li key={slot} className={filled[slot] === true ? 'is-filled' : ''}>
          <CropIconBadge cropId={cropId} isFilled={filled[slot] === true} />
        </li>
      ))}
    </ul>
  );
}
