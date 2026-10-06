import type { ReactElement } from 'react';
import { useStore } from '../state/store.ts';
import { panelId } from './SidePanel.tsx';

/** A market stall: striped awning over a counter with a door. */
const SHOP_PATH =
  'M3 4h18l1 5H2zM2 9c0 2 4 2 4 0c0 2 4 2 4 0c0 2 4 2 4 0c0 2 4 2 4 0c0 2 4 2 4 0M4 11v9h16v-9M10 20v-5h4v5';

function ShopIcon(): ReactElement {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={SHOP_PATH} />
    </svg>
  );
}

/** Top right: opens and closes the shop panel. */
export function ShopButton(): ReactElement {
  const isOpen = useStore((state) => state.openPanel === 'shop');
  const togglePanel = useStore((state) => state.togglePanel);
  return (
    <button
      className="tile"
      onClick={() => togglePanel('shop')}
      aria-label="Shop"
      title="Shop"
      aria-expanded={isOpen}
      aria-controls={panelId('shop')}
    >
      <ShopIcon />
    </button>
  );
}
