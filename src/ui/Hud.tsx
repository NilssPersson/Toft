import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { spinsRequired, unlockedCrops } from '../game/index.ts';
import type { CropDef } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { FullscreenButton, useFullscreenOnFirstInteraction } from './Fullscreen.tsx';
import { UpdatePrompt } from './UpdatePrompt.tsx';
import { Wheel } from './Wheel.tsx';

/** Esc stops placing the selected crop. */
function useEscapeToDeselect(): void {
  const selectCrop = useStore((state) => state.selectCrop);
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') selectCrop(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [selectCrop]);
}

function LevelPanel(): ReactElement {
  const { level, spinsRemaining } = useStore((state) => state.game.progression);
  const required = spinsRequired(level);
  const wins = required - spinsRemaining;
  return (
    <div className="panel level-panel">
      <div className="level">Level {level}</div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(wins / required) * 100}%` }} />
      </div>
      <div className="progress-label">
        {wins} / {required} wins
      </div>
    </div>
  );
}

function CropButton({ crop }: { crop: CropDef }): ReactElement {
  const selected = useStore((state) => state.selectedCrop);
  const selectCrop = useStore((state) => state.selectCrop);
  const isSelected = selected === crop.id;
  return (
    <button
      className={`crop-button ${isSelected ? 'selected' : ''}`}
      onClick={() => selectCrop(isSelected ? null : crop.id)}
    >
      <span className="swatch" style={{ background: crop.color }} />
      {crop.name}
      <small>
        {crop.footprint.w}×{crop.footprint.d} · {crop.growSeconds}s
      </small>
    </button>
  );
}

function NewIslandButton(): ReactElement {
  const reset = useStore((state) => state.reset);
  const onClick = (): void => {
    if (window.confirm('Start a fresh island? This clears your save.')) reset();
  };
  return (
    <button className="reset-save" onClick={onClick}>
      New island
    </button>
  );
}

function CropPalette(): ReactElement {
  const level = useStore((state) => state.game.progression.level);
  const isPlacing = useStore((state) => state.selectedCrop !== null);
  return (
    <div className="panel palette">
      {unlockedCrops(level).map((crop) => (
        <CropButton key={crop.id} crop={crop} />
      ))}
      <span className="hint">
        {isPlacing ? 'Click the island to plant · Esc to stop' : 'Pick a crop · click blue to water, yellow to harvest'}
      </span>
      <NewIslandButton />
    </div>
  );
}

export function Hud(): ReactElement {
  useEscapeToDeselect();
  useFullscreenOnFirstInteraction();
  return (
    <div className="hud">
      <LevelPanel />
      <FullscreenButton />
      <UpdatePrompt />
      <Wheel />
      <CropPalette />
    </div>
  );
}
