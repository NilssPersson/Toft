import { useEffect } from 'react';
import { cancelBuild, confirmBuild, nudgeGhost, rotateGhost } from '../state/build.ts';
import { useStore } from '../state/store.ts';

/** Keys that work in build mode. Arrows and WASD move the ghost one cell, as seen on screen. */
const BUILD_KEYS: Record<string, () => void> = {
  ArrowUp: () => nudgeGhost('up'),
  ArrowDown: () => nudgeGhost('down'),
  ArrowLeft: () => nudgeGhost('left'),
  ArrowRight: () => nudgeGhost('right'),
  w: () => nudgeGhost('up'),
  s: () => nudgeGhost('down'),
  a: () => nudgeGhost('left'),
  d: () => nudgeGhost('right'),
  r: rotateGhost,
  Enter: confirmBuild,
};

/** Enter or Space on a focused button already clicks it; handling the key as well would act twice. */
function isButtonKey(event: KeyboardEvent): boolean {
  return event.target instanceof HTMLButtonElement && (event.key === 'Enter' || event.key === ' ');
}

function hasModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

function onBuildKey(event: KeyboardEvent): void {
  const action = BUILD_KEYS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
  if (!action || hasModifier(event) || isButtonKey(event)) return;
  event.preventDefault();
  action();
}

/** Esc leaves build mode and closes the open panel (unless the wheel is turning); in build mode, the build keys. */
function onKey(event: KeyboardEvent): void {
  const { buildDraft, closePanel } = useStore.getState();
  if (event.key === 'Escape') {
    cancelBuild();
    closePanel();
  } else if (buildDraft) {
    onBuildKey(event);
  }
}

export function useHudKeys(): void {
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);
}
