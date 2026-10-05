import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';
import { cropDetails, cropTitle } from './cropText.ts';
import { LockIcon } from './LockIcon.tsx';
import { useCropChoices, useToggleCrop } from './useCropChoices.ts';
import type { CropChoice } from './useCropChoices.ts';
import { usePopover } from './usePopover.ts';

const BASKET_PATH = 'M3 10h18l-2 10H5zM8 10l4-6 4 6M9 14v3M15 14v3';

function BasketIcon(): ReactElement {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={BASKET_PATH} />
    </svg>
  );
}

function CropMenuItem({ choice, onPick }: { choice: CropChoice; onPick: () => void }): ReactElement {
  const { crop, isUnlocked } = choice;
  const isSelected = useStore((state) => state.selectedCrop === crop.id);
  const toggleCrop = useToggleCrop();
  const onClick = (): void => {
    if (!isUnlocked) return;
    toggleCrop(choice);
    onPick();
  };
  return (
    <button
      className={`menu-item crop-item ${isSelected ? 'is-selected' : ''}`}
      role="menuitem"
      onClick={onClick}
      aria-disabled={!isUnlocked}
      title={cropTitle(crop, isUnlocked)}
    >
      {isUnlocked ? <span className="swatch" style={{ background: crop.color }} /> : <LockIcon />}
      <span className="crop-item-name">{crop.name}</span>
      <small>{isUnlocked ? cropDetails(crop) : `Level ${crop.unlockLevel}`}</small>
    </button>
  );
}

/** The basket in the top-right corner: every crop with its size and grow time; picking one starts planting it. */
export function BuyMenu(): ReactElement {
  const { isOpen, toggle, close, containerRef } = usePopover();
  const choices = useCropChoices();
  return (
    <div className="menu" ref={containerRef}>
      <button
        className="tile"
        onClick={toggle}
        aria-label="Buy crops"
        title="Buy crops"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <BasketIcon />
      </button>
      {isOpen && (
        <div className="panel popover crop-menu" role="menu" aria-label="Buy crops">
          {choices.map((choice) => (
            <CropMenuItem key={choice.crop.id} choice={choice} onPick={close} />
          ))}
        </div>
      )}
    </div>
  );
}
