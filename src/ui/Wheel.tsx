import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  CROP_SLOTS,
  WHEEL_SPOTS,
  canSpin,
  filledCount,
  multiplierActive,
  multiplierBonus,
  spotKind,
  unlockedCrops,
} from '../game/index.ts';
import type { CropDef, SpinResult } from '../game/index.ts';
import { spin, useStore } from '../state/store.ts';
import { prefersReducedMotion } from './motion.ts';

const RADIUS = 100;
const SEGMENT_DEGREES = 360 / WHEEL_SPOTS;
const SPIN_MS = 2600;
const FULL_TURNS = 4;
const DIMMED = 0.3;

/** Exposed as data-state on the wheel, so tests can wait for a spin to finish. */
type WheelPhase = 'idle' | 'spinning' | 'result';

interface SegmentStyle {
  fill: string;
  label: string;
  opacity: number;
}

interface SegmentContext {
  crops: CropDef[];
  filled: boolean[];
  level: number;
}

function polarPoint(degrees: number, radius: number): [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [RADIUS + radius * Math.sin(radians), RADIUS - radius * Math.cos(radians)];
}

function segmentPath(index: number): string {
  const [startX, startY] = polarPoint(index * SEGMENT_DEGREES, RADIUS);
  const [endX, endY] = polarPoint((index + 1) * SEGMENT_DEGREES, RADIUS);
  return `M ${RADIUS} ${RADIUS} L ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY} Z`;
}

function cropSegmentStyle(crop: CropDef | undefined, isFilled: boolean): SegmentStyle {
  if (!crop) return { fill: '#d6d0c4', label: '—', opacity: 1 };
  return { fill: crop.color, label: crop.name, opacity: isFilled ? 1 : DIMMED };
}

function segmentStyle(index: number, context: SegmentContext): SegmentStyle {
  switch (spotKind(index)) {
    case 'crop':
      return cropSegmentStyle(context.crops[index], context.filled[index] === true);
    case 'multiplier': {
      const isActive = multiplierActive({ filled: context.filled });
      return { fill: '#f4c542', label: `×${multiplierBonus(context.level)}`, opacity: isActive ? 1 : DIMMED };
    }
    case 'reset':
      return { fill: '#d65a4a', label: 'Reset', opacity: 1 };
  }
}

/** How far to turn so the wheel stops with the landed spot under the pointer, after a few full turns. */
function spinDelta(rotation: number, spotIndex: number): number {
  const target = (360 - (spotIndex * SEGMENT_DEGREES + SEGMENT_DEGREES / 2)) % 360;
  const current = ((rotation % 360) + 360) % 360;
  return 360 * FULL_TURNS + ((target - current + 360) % 360);
}

const OUTCOME_TEXT: Record<SpinResult['outcome'], (result: SpinResult) => string> = {
  win: () => 'Win! −1 spin',
  multiplier: (result) => `Multiplier! −${result.progress} spins`,
  reset: () => 'Reset — progress lost',
};

function describe(result: SpinResult): string {
  const base = OUTCOME_TEXT[result.outcome](result);
  return result.leveledUp ? `${base} · Level up!` : base;
}

/** How long the wheel turns: no time at all with reduced motion. */
function spinDuration(): number {
  return prefersReducedMotion() ? 0 : SPIN_MS;
}

/** Runs `finish` once the wheel has stopped turning; straight away with reduced motion. */
function whenSpinEnds(finish: () => void): void {
  const duration = spinDuration();
  if (duration === 0) finish();
  else window.setTimeout(finish, duration);
}

function wheelPhase(isSpinning: boolean, shown: SpinResult | null): WheelPhase {
  if (isSpinning) return 'spinning';
  return shown ? 'result' : 'idle';
}

interface WheelSpin {
  rotation: number;
  isSpinning: boolean;
  shown: SpinResult | null;
  phase: WheelPhase;
  /** The filled slots to draw: frozen at their pre-spin value while the wheel turns. */
  filled: boolean[];
  onSpin: () => void;
}

function useWheelSpin(): WheelSpin {
  const wheel = useStore((state) => state.game.wheel);
  const setWheelSpinning = useStore((state) => state.setWheelSpinning);
  const [rotation, setRotation] = useState(0);
  const [shown, setShown] = useState<SpinResult | null>(null);
  // The rules clear the wheel instantly; keep showing the pre-spin wheel until it stops.
  const [frozenFilled, setFrozenFilled] = useState<boolean[] | null>(null);
  const isSpinning = frozenFilled !== null;

  const onSpin = (): void => {
    if (isSpinning || !canSpin(wheel)) return;
    setFrozenFilled(wheel.filled);
    setWheelSpinning(true);
    spin();
    const result = useStore.getState().game.lastSpin;
    if (!result) return;
    setRotation(rotation + spinDelta(rotation, result.spotIndex));
    setShown(null);
    whenSpinEnds(() => {
      setFrozenFilled(null);
      setWheelSpinning(false);
      setShown(result);
    });
  };

  const phase = wheelPhase(isSpinning, shown);
  return { rotation, isSpinning, shown, phase, filled: frozenFilled ?? wheel.filled, onSpin };
}

function WheelSegment({ index, style }: { index: number; style: SegmentStyle }): ReactElement {
  const middleDegrees = index * SEGMENT_DEGREES + SEGMENT_DEGREES / 2;
  const [labelX, labelY] = polarPoint(middleDegrees, RADIUS * 0.66);
  return (
    <g>
      <path d={segmentPath(index)} fill={style.fill} fillOpacity={style.opacity} stroke="#fffaf0" strokeWidth={2} />
      <text x={labelX} y={labelY} className="wheel-label" transform={`rotate(${middleDegrees} ${labelX} ${labelY})`}>
        {style.label}
      </text>
    </g>
  );
}

interface WheelFaceProps {
  rotation: number;
  filled: boolean[];
  phase: WheelPhase;
}

function WheelFace({ rotation, filled, phase }: WheelFaceProps): ReactElement {
  const level = useStore((state) => state.game.progression.level);
  const context: SegmentContext = { crops: unlockedCrops(level), filled, level };
  return (
    <div className="wheel-area">
      <div className="wheel-wrap">
        <div className="wheel-pointer" />
        <svg
          viewBox={`0 0 ${RADIUS * 2} ${RADIUS * 2}`}
          className="wheel"
          role="img"
          aria-label="Wheel"
          data-state={phase}
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${spinDuration()}ms` }}
        >
          {Array.from({ length: WHEEL_SPOTS }, (_, i) => (
            <WheelSegment key={i} index={i} style={segmentStyle(i, context)} />
          ))}
          <circle cx={RADIUS} cy={RADIUS} r={14} fill="#fffaf0" />
        </svg>
      </div>
    </div>
  );
}

function SpinButton({ isSpinning, onSpin }: { isSpinning: boolean; onSpin: () => void }): ReactElement {
  const wheel = useStore((state) => state.game.wheel);
  return (
    <button className="spin-button" onClick={onSpin} disabled={isSpinning || !canSpin(wheel)}>
      {isSpinning ? 'Spinning…' : `Spin (${filledCount(wheel)}/${CROP_SLOTS} filled)`}
    </button>
  );
}

/** The wheel, its Spin button and the last result, laid out by the side panel. The wheel scales to fit its area. */
export function Wheel(): ReactElement {
  const { rotation, isSpinning, shown, phase, filled, onSpin } = useWheelSpin();
  return (
    <>
      <WheelFace rotation={rotation} filled={filled} phase={phase} />
      <SpinButton isSpinning={isSpinning} onSpin={onSpin} />
      <p className="spin-result" role="status">
        {shown ? describe(shown) : ' '}
      </p>
    </>
  );
}
