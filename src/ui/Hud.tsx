import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';
import { FullscreenButton, useFullscreenOnFirstInteraction } from './Fullscreen.tsx';
import { HintToast } from './HintToast.tsx';
import { LevelChip } from './LevelChip.tsx';
import { SettingsMenu } from './SettingsMenu.tsx';
import { ShopButton } from './ShopButton.tsx';
import { ShopPanel } from './ShopPanel.tsx';
import { StarButton } from './StarButton.tsx';
import { UpdatePrompt } from './UpdatePrompt.tsx';
import { WheelPanel } from './WheelPanel.tsx';
import { useHudKeys } from './useHudKeys.ts';

function SystemButtons(): ReactElement {
  return (
    <div className="hud-top-right">
      <div className="tile-row">
        <ShopButton />
        <FullscreenButton />
        <SettingsMenu />
      </div>
      <UpdatePrompt />
    </div>
  );
}

/** Lays the HUD out along the screen edges, leaving the middle to the island. */
export function Hud(): ReactElement {
  useHudKeys();
  useFullscreenOnFirstInteraction();
  const isPanelOpen = useStore((state) => state.openPanel !== null);
  return (
    <div className={`hud ${isPanelOpen ? 'is-panel-open' : ''}`}>
      <WheelPanel />
      <ShopPanel />
      <LevelChip />
      <SystemButtons />
      <StarButton />
      <HintToast />
    </div>
  );
}
