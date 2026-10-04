import { useEffect } from 'react';
import { spinsRequired, unlockedCrops } from '../game/index.ts';
import { useStore } from '../state/store.ts';
import { Wheel } from './Wheel.tsx';

export function Hud() {
  const { level, spinsRemaining } = useStore((s) => s.game.progression);
  const selected = useStore((s) => s.selectedCrop);
  const selectCrop = useStore((s) => s.selectCrop);
  const reset = useStore((s) => s.reset);
  const required = spinsRequired(level);
  const crops = unlockedCrops(level);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectCrop(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectCrop]);

  return (
    <div className="hud">
      <div className="panel level-panel">
        <div className="level">Level {level}</div>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${((required - spinsRemaining) / required) * 100}%` }} />
        </div>
        <div className="progress-label">
          {required - spinsRemaining} / {required} wins
        </div>
      </div>

      <Wheel />

      <div className="panel palette">
        {crops.map((c) => (
          <button
            key={c.id}
            className={`crop-button ${selected === c.id ? 'selected' : ''}`}
            onClick={() => selectCrop(selected === c.id ? null : c.id)}
          >
            <span className="swatch" style={{ background: c.color }} />
            {c.name}
            <small>
              {c.footprint.w}×{c.footprint.d} · {c.growSeconds}s
            </small>
          </button>
        ))}
        <span className="hint">
          {selected
            ? 'Click the island to plant · Esc to stop'
            : 'Pick a crop · click blue to water, yellow to harvest'}
        </span>
        <button
          className="reset-save"
          onClick={() => {
            if (window.confirm('Start a fresh island? This clears your save.')) reset();
          }}
        >
          New island
        </button>
      </div>
    </div>
  );
}
