import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { cellKey } from '../game/index.ts';
import { buildStatus } from '../state/build.ts';
import type { BuildStatus } from '../state/build.ts';
import { now } from '../state/clock.ts';
import { useStore } from '../state/store.ts';

export interface BuildSignal {
  status: BuildStatus;
  /** The ghost's cell as "x,z"; empty when not building. */
  cell: string;
}

function readSignal(): BuildSignal {
  const { game, buildDraft } = useStore.getState();
  return { status: buildStatus(game, buildDraft, now()), cell: buildDraft ? cellKey(buildDraft.cell) : '' };
}

/**
 * Reports build mode and whether the ghost's spot is valid, passed on only when it changes. Checked on every store
 * change, so it follows the ghost at once even while frames are slow, and every frame, since the player walking
 * onto or off the ghost's cell changes it without a store change.
 */
export function BuildStateSignal({ onChange }: { onChange: (signal: BuildSignal) => void }): null {
  const last = useRef('');
  const report = (): void => {
    const signal = readSignal();
    const key = `${signal.status} ${signal.cell}`;
    if (key === last.current) return;
    last.current = key;
    onChange(signal);
  };
  useEffect(() => useStore.subscribe(report));
  useFrame(report);
  return null;
}
