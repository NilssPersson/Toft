import type { ReactElement } from 'react';
import { buildStatus, cancelBuild, canRotate, confirmBuild, rotateGhost } from '../state/build.ts';
import { now } from '../state/clock.ts';
import { useStore } from '../state/store.ts';

const ROTATE_PATH = 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5';

function RotateIcon(): ReactElement {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d={ROTATE_PATH} />
    </svg>
  );
}

/** True while the ghost sits where the rules would accept it. */
function useIsDraftValid(): boolean {
  return useStore((state) => buildStatus(state.game, state.buildDraft, now()) === 'valid');
}

/**
 * ✕, rotate (for items that turn) and ✓, floating over the ghost in build mode. ✓ is disabled while the spot is
 * invalid. Plain DOM; the scene anchors it above the ghost.
 */
export function BuildControls(): ReactElement | null {
  const draft = useStore((state) => state.buildDraft);
  const isValid = useIsDraftValid();
  if (!draft) return null;
  return (
    <div className="build-controls" role="group" aria-label="Build controls">
      <button className="round-button is-cancel" onClick={cancelBuild} aria-label="Cancel" title="Cancel (Esc)">
        <span aria-hidden="true">✕</span>
      </button>
      {canRotate(draft) && (
        <button className="round-button" onClick={rotateGhost} aria-label="Rotate" title="Rotate (R)">
          <RotateIcon />
        </button>
      )}
      <button
        className="round-button is-confirm"
        onClick={confirmBuild}
        disabled={!isValid}
        aria-label="Confirm"
        title="Confirm (Enter)"
      >
        <span aria-hidden="true">✓</span>
      </button>
    </div>
  );
}
