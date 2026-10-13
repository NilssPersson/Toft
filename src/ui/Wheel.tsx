import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  CROP_SLOTS,
  WHEEL_SPOTS,
  canSpin,
  currentRecipe,
  filledCount,
  multiplierActive,
  multiplierBonus,
  slotForSpot,
  spotKind,
} from '../game/index.ts';
import type { Recipe, SpinResult } from '../game/index.ts';
import { spin, useStore } from '../state/store.ts';
import { CropIconGroup } from './CropIcon.tsx';
import { prefersReducedMotion } from './motion.ts';

const RADIUS = 100;
const SEGMENT_DEGREES = 360 / WHEEL_SPOTS;
const CONTENT_RADIUS = RADIUS * 0.64;
const TILE_SIZE = 30;
const ICON_SCALE = 1.05;
const ICON_BOX = 24;
const SPIN_MS = 2600;
const FULL_TURNS = 4;

const WOOD = '#7a5236';
const RIM = '#fff4d6';
const SEGMENT_BROWN = '#9a6a43';
const SEGMENT_GOLD = '#f2c14e';
const TILE_BROWN = '#b3855a';
const TILE_GOLD = '#fbe3a0';

/** Exposed as data-state on the wheel, so tests can wait for a spin to finish. */
type WheelPhase = 'idle' | 'spinning' | 'result';

/** What the wheel draws. Frozen at its pre-spin value while the wheel turns, since a spin changes it at once. */
interface WheelSnapshot {
  filled: boolean[];
  recipe: Recipe;
  level: number;
}

function polarPoint(degrees: number, radius: number): [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [RADIUS + radius * Math.sin(radians), RADIUS - radius * Math.cos(radians)];
}

/** Spot i is centred i segments clockwise from the top, so spot 0 sits under the pointer at rest. */
function segmentPath(index: number): string {
  const [startX, startY] = polarPoint((index - 0.5) * SEGMENT_DEGREES, RADIUS);
  const [endX, endY] = polarPoint((index + 0.5) * SEGMENT_DEGREES, RADIUS);
  return `M ${RADIUS} ${RADIUS} L ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 0 1 ${endX} ${endY} Z`;
}

/** A segment turns gold once it can pay out: a filled slot, or the multiplier once all 6 are filled. */
function isSegmentGold(index: number, snapshot: WheelSnapshot): boolean {
  switch (spotKind(index)) {
    case 'crop':
      return snapshot.filled[slotForSpot(index)] === true;
    case 'multiplier':
      return multiplierActive({ filled: snapshot.filled });
    case 'empty':
      return false;
  }
}

/** How far to turn so the wheel stops with the landed spot under the pointer, after a few full turns. */
function spinDelta(rotation: number, spotIndex: number): number {
  const target = (360 - spotIndex * SEGMENT_DEGREES) % 360;
  const current = ((rotation % 360) + 360) % 360;
  return 360 * FULL_TURNS + ((target - current + 360) % 360);
}

const OUTCOME_TEXT: Record<SpinResult['outcome'], (result: SpinResult) => string> = {
  win: () => 'Win! −1 spin',
  multiplier: (result) => `Multiplier! −${result.progress} spins`,
  miss: () => 'Miss — crops lost, progress kept',
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

function useLiveSnapshot(): WheelSnapshot {
  const filled = useStore((state) => state.game.wheel.filled);
  const progression = useStore((state) => state.game.progression);
  return { filled, recipe: currentRecipe(progression), level: progression.level };
}

interface WheelSpin {
  rotation: number;
  isSpinning: boolean;
  shown: SpinResult | null;
  phase: WheelPhase;
  snapshot: WheelSnapshot;
  onSpin: () => void;
}

function useWheelSpin(): WheelSpin {
  const live = useLiveSnapshot();
  const setWheelSpinning = useStore((state) => state.setWheelSpinning);
  const [rotation, setRotation] = useState(0);
  const [shown, setShown] = useState<SpinResult | null>(null);
  const [frozen, setFrozen] = useState<WheelSnapshot | null>(null);
  const isSpinning = frozen !== null;

  const onSpin = (): void => {
    if (isSpinning || !canSpin({ filled: live.filled })) return;
    setFrozen(live);
    setWheelSpinning(true);
    spin();
    const result = useStore.getState().game.lastSpin;
    if (!result) return;
    setRotation(rotation + spinDelta(rotation, result.spotIndex));
    setShown(null);
    whenSpinEnds(() => {
      setFrozen(null);
      setWheelSpinning(false);
      setShown(result);
    });
  };

  const phase = wheelPhase(isSpinning, shown);
  return { rotation, isSpinning, shown, phase, snapshot: frozen ?? live, onSpin };
}

/** A crop slot's icon on a light tile. */
function SlotTile({ cropId, isGold }: { cropId: string; isGold: boolean }): ReactElement {
  const half = TILE_SIZE / 2;
  const iconOffset = (-ICON_BOX * ICON_SCALE) / 2;
  return (
    <g>
      <rect x={-half} y={-half} width={TILE_SIZE} height={TILE_SIZE} rx={7} fill={isGold ? TILE_GOLD : TILE_BROWN} />
      <g transform={`translate(${iconOffset} ${iconOffset}) scale(${ICON_SCALE})`}>
        <CropIconGroup cropId={cropId} />
      </g>
    </g>
  );
}

interface SegmentProps {
  index: number;
  snapshot: WheelSnapshot;
  isGold: boolean;
}

function SegmentContent({ index, snapshot, isGold }: SegmentProps): ReactElement | null {
  switch (spotKind(index)) {
    case 'crop':
      return <SlotTile cropId={snapshot.recipe[slotForSpot(index)] ?? ''} isGold={isGold} />;
    case 'multiplier':
      return <text className={`wheel-multiplier ${isGold ? 'is-gold' : ''}`}>×{multiplierBonus(snapshot.level)}</text>;
    case 'empty':
      return null;
  }
}

function WheelSegment({ index, snapshot }: { index: number; snapshot: WheelSnapshot }): ReactElement {
  const isGold = isSegmentGold(index, snapshot);
  const middleDegrees = index * SEGMENT_DEGREES;
  const [contentX, contentY] = polarPoint(middleDegrees, CONTENT_RADIUS);
  return (
    <g>
      <path d={segmentPath(index)} fill={isGold ? SEGMENT_GOLD : SEGMENT_BROWN} stroke={RIM} strokeWidth={2} />
      <g transform={`translate(${contentX} ${contentY}) rotate(${middleDegrees})`}>
        <SegmentContent index={index} snapshot={snapshot} isGold={isGold} />
      </g>
    </g>
  );
}

interface WheelFaceProps {
  rotation: number;
  snapshot: WheelSnapshot;
  phase: WheelPhase;
}

function WheelFace({ rotation, snapshot, phase }: WheelFaceProps): ReactElement {
  return (
    <svg
      viewBox={`0 0 ${RADIUS * 2} ${RADIUS * 2}`}
      className="wheel"
      role="img"
      aria-label="Wheel"
      data-state={phase}
      style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${spinDuration()}ms` }}
    >
      <circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill={WOOD} />
      {Array.from({ length: WHEEL_SPOTS }, (_, i) => (
        <WheelSegment key={i} index={i} snapshot={snapshot} />
      ))}
    </svg>
  );
}

interface SpinButtonProps {
  isSpinning: boolean;
  onSpin: () => void;
}

/** The round button in the middle of the wheel. Its name says how many slots are filled. */
function SpinButton({ isSpinning, onSpin }: SpinButtonProps): ReactElement {
  const wheel = useStore((state) => state.game.wheel);
  const count = `${filledCount(wheel)}/${CROP_SLOTS}`;
  return (
    <button
      className="hub-button"
      onClick={onSpin}
      disabled={isSpinning || !canSpin(wheel)}
      aria-label={isSpinning ? 'Spinning…' : `Spin (${count} filled)`}
    >
      <span className="hub-button-label">Spin</span>
      <span className="hub-button-count">{count}</span>
    </button>
  );
}

/** The wheel with its Spin button in the middle, and the last result, laid out by the side panel. */
export function Wheel(): ReactElement {
  const { rotation, isSpinning, shown, phase, snapshot, onSpin } = useWheelSpin();
  return (
    <>
      <div className="wheel-area">
        <div className="wheel-wrap">
          <div className="wheel-pointer" />
          <WheelFace rotation={rotation} snapshot={snapshot} phase={phase} />
          <SpinButton isSpinning={isSpinning} onSpin={onSpin} />
        </div>
      </div>
      <p className="spin-result" role="status">
        {shown ? describe(shown) : ' '}
      </p>
    </>
  );
}
