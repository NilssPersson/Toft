import type { ReactElement } from 'react';

const LOCK_PATH = 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z';

export function LockIcon(): ReactElement {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d={LOCK_PATH} />
    </svg>
  );
}
