import { useRef, useState } from 'react';
import {
  CROP_SLOTS,
  MULTIPLIER_SPOT,
  WHEEL_SPOTS,
  canSpin,
  filledCount,
  multiplierBonus,
  unlockedCrops,
} from '../game/index.ts';
import type { SpinResult } from '../game/index.ts';
import { spin, useStore } from '../state/store.ts';

const R = 100;
const SEG = 360 / WHEEL_SPOTS;
const SPIN_MS = 2600;

function point(deg: number, r: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [R + r * Math.sin(rad), R - r * Math.cos(rad)];
}

function segmentPath(i: number): string {
  const [x1, y1] = point(i * SEG, R);
  const [x2, y2] = point((i + 1) * SEG, R);
  return `M ${R} ${R} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

export function Wheel() {
  const wheel = useStore((s) => s.game.wheel);
  const level = useStore((s) => s.game.progression.level);
  const crops = unlockedCrops(level);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [shown, setShown] = useState<SpinResult | null>(null);
  // The rules clear the wheel instantly; keep showing the pre-spin wheel until it stops.
  const snapshot = useRef(wheel.filled);
  const filled = spinning ? snapshot.current : wheel.filled;
  const multiplierOn = filled.filter(Boolean).length === CROP_SLOTS;

  const onSpin = () => {
    if (spinning || !canSpin(wheel)) return;
    snapshot.current = wheel.filled;
    spin();
    const result = useStore.getState().game.lastSpin;
    if (!result) return;

    const target = (360 - (result.spotIndex * SEG + SEG / 2)) % 360;
    const current = ((rotation % 360) + 360) % 360;
    setRotation(rotation + 360 * 4 + ((target - current + 360) % 360));
    setShown(null);
    setSpinning(true);
    window.setTimeout(() => {
      setSpinning(false);
      setShown(result);
    }, SPIN_MS);
  };

  return (
    <div className="panel wheel-panel">
      <div className="wheel-wrap">
        <div className="wheel-pointer" />
        <svg
          viewBox={`0 0 ${R * 2} ${R * 2}`}
          className="wheel"
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${SPIN_MS}ms` }}
        >
          {Array.from({ length: WHEEL_SPOTS }, (_, i) => {
            const mid = point(i * SEG + SEG / 2, R * 0.66);
            let fill = '#d6d0c4';
            let label = '—';
            let opacity = 1;
            if (i < CROP_SLOTS) {
              const crop = crops[i];
              if (crop) {
                fill = crop.color;
                label = crop.name;
                opacity = filled[i] ? 1 : 0.3;
              }
            } else if (i === MULTIPLIER_SPOT) {
              fill = '#f4c542';
              label = `×${multiplierBonus(level)}`;
              opacity = multiplierOn ? 1 : 0.3;
            } else {
              fill = '#d65a4a';
              label = 'Reset';
            }
            return (
              <g key={i}>
                <path d={segmentPath(i)} fill={fill} fillOpacity={opacity} stroke="#fffaf0" strokeWidth={2} />
                <text
                  x={mid[0]}
                  y={mid[1]}
                  className="wheel-label"
                  transform={`rotate(${i * SEG + SEG / 2} ${mid[0]} ${mid[1]})`}
                >
                  {label}
                </text>
              </g>
            );
          })}
          <circle cx={R} cy={R} r={14} fill="#fffaf0" />
        </svg>
      </div>

      <button className="spin-button" onClick={onSpin} disabled={spinning || !canSpin(wheel)}>
        {spinning ? 'Spinning…' : `Spin (${filledCount(wheel)}/${CROP_SLOTS} filled)`}
      </button>
      <p className="spin-result">{shown ? describe(shown) : ' '}</p>
    </div>
  );
}

function describe(r: SpinResult): string {
  const base =
    r.outcome === 'win'
      ? 'Win! −1 spin'
      : r.outcome === 'multiplier'
        ? `Multiplier! −${r.progress} spins`
        : 'Reset — progress lost';
  return r.leveledUp ? `${base} · Level up!` : base;
}
