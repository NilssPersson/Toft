import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { isWalking } from '../game/index.ts';
import { now } from '../state/clock.ts';
import { useStore } from '../state/store.ts';

export type PlayerActivity = 'idle' | 'walking';

/** Reports whether the player is walking, checked every frame but passed on only when it changes. */
export function PlayerStateSignal({ onChange }: { onChange: (activity: PlayerActivity) => void }): null {
  const last = useRef<PlayerActivity | null>(null);
  useFrame(() => {
    const activity = isWalking(useStore.getState().game, now()) ? 'walking' : 'idle';
    if (activity === last.current) return;
    last.current = activity;
    onChange(activity);
  });
  return null;
}
