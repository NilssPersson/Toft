import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';
import { BuyMenu } from './BuyMenu.tsx';
import { CropHotbar } from './CropHotbar.tsx';
import { FullscreenButton, useFullscreenOnFirstInteraction } from './Fullscreen.tsx';
import { HintToast } from './HintToast.tsx';
import { LevelChip } from './LevelChip.tsx';
import { SettingsMenu } from './SettingsMenu.tsx';
import { SidePanel } from './SidePanel.tsx';
import { StarButton } from './StarButton.tsx';
import { UpdatePrompt } from './UpdatePrompt.tsx';

/** Esc stops placing the selected crop and closes the side panel (unless the wheel is turning). */
function useEscape(): void {
  const selectCrop = useStore((state) => state.selectCrop);
  const closePanel = useStore((state) => state.closePanel);
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      selectCrop(null);
      closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [selectCrop, closePanel]);
}

function SystemButtons(): ReactElement {
  return (
    <div className="hud-top-right">
      <div className="tile-row">
        <BuyMenu />
        <FullscreenButton />
        <SettingsMenu />
      </div>
      <UpdatePrompt />
    </div>
  );
}

/** Lays the HUD out along the screen edges, leaving the middle to the island. */
export function Hud(): ReactElement {
  useEscape();
  useFullscreenOnFirstInteraction();
  const isPanelOpen = useStore((state) => state.isPanelOpen);
  return (
    <div className={`hud ${isPanelOpen ? 'is-panel-open' : ''}`}>
      <SidePanel />
      <LevelChip />
      <SystemButtons />
      <StarButton />
      <HintToast />
      <CropHotbar />
    </div>
  );
}
