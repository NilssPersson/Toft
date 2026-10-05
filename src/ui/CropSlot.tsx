import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';
import { cropTitle } from './cropText.ts';
import { LockIcon } from './LockIcon.tsx';
import { useToggleCrop } from './useCropChoices.ts';
import type { CropChoice } from './useCropChoices.ts';

function SlotFace({ crop, isUnlocked }: CropChoice): ReactElement {
  if (!isUnlocked) return <LockIcon />;
  return <span className="slot-swatch" style={{ background: crop.color }} />;
}

/** One square in the hotbar: the crop's colour and name, or a lock and the level that unlocks it. */
export function CropSlot({ choice }: { choice: CropChoice }): ReactElement {
  const { crop, isUnlocked } = choice;
  const isSelected = useStore((state) => state.selectedCrop === crop.id);
  const toggleCrop = useToggleCrop();
  return (
    <button
      className={`crop-slot ${isSelected ? 'is-selected' : ''}`}
      onClick={() => toggleCrop(choice)}
      aria-pressed={isSelected}
      aria-disabled={!isUnlocked}
      title={cropTitle(crop, isUnlocked)}
    >
      <span className="slot-tile">
        <SlotFace {...choice} />
      </span>
      <span className="slot-name">{isUnlocked ? crop.name : `Level ${crop.unlockLevel}`}</span>
    </button>
  );
}
