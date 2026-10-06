import { useRef } from 'react';
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
 * Reports build mode and whether the ghost's spot is valid, checked every frame (the player walking can change it)
 * but passed on only when it changes.
 */
export function BuildStateSignal({ onChange }: { onChange: (signal: BuildSignal) => void }): null {
  const last = useRef('');
  useFrame(() => {
    const signal = readSignal();
    const key = `${signal.status} ${signal.cell}`;
    if (key === last.current) return;
    last.current = key;
    onChange(signal);
  });
  return null;
}
