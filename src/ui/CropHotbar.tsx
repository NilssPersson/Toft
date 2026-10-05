import type { ReactElement } from 'react';
import { CropSlot } from './CropSlot.tsx';
import { useCropChoices } from './useCropChoices.ts';

/** The crops as an inventory row in the bottom-right corner, locked ones greyed out. */
export function CropHotbar(): ReactElement {
  const choices = useCropChoices();
  return (
    <nav className="panel crop-hotbar" aria-label="Crops">
      {choices.map((choice) => (
        <CropSlot key={choice.crop.id} choice={choice} />
      ))}
    </nav>
  );
}
