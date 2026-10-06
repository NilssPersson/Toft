import { useState } from 'react';
import type { ReactElement } from 'react';
import { startBuild } from '../state/build.ts';
import { SHOP_ITEMS, itemDetails } from '../state/shopItems.ts';
import type { ShopItem, ShopKind } from '../state/shopItems.ts';
import { useStore } from '../state/store.ts';
import { LockIcon } from './LockIcon.tsx';
import { PanelCloseButton, SidePanel, panelTitleId } from './SidePanel.tsx';

const TAB_LABELS: Record<ShopKind, string> = { crop: 'Crops', decoration: 'Decorations' };
const TABS: ShopKind[] = ['crop', 'decoration'];

function tabId(kind: ShopKind): string {
  return `shop-tab-${kind}`;
}

function ItemSwatch({ item }: { item: ShopItem }): ReactElement {
  const shape = item.kind === 'crop' ? 'is-round' : 'is-square';
  return <span className={`shop-swatch ${shape}`} style={{ background: item.color }} aria-hidden="true" />;
}

function LockedBadge({ level }: { level: number }): ReactElement {
  return (
    <span className="shop-lock">
      <LockIcon />
      Level {level}
    </span>
  );
}

/** One item: swatch, name and size (and grow time); locked items show the level they unlock at and can't be picked. */
function ShopTile({ item }: { item: ShopItem }): ReactElement {
  const isLocked = useStore((state) => item.unlockLevel > state.game.progression.level);
  const onClick = (): void => {
    if (!isLocked) startBuild(item.id);
  };
  return (
    <button className="shop-tile" onClick={onClick} aria-disabled={isLocked}>
      <ItemSwatch item={item} />
      <span className="shop-tile-name">{item.name}</span>
      <small className="shop-tile-details">{itemDetails(item)}</small>
      {isLocked && <LockedBadge level={item.unlockLevel} />}
    </button>
  );
}

interface ShopTabsProps {
  selected: ShopKind;
  onSelect: (kind: ShopKind) => void;
}

function ShopTabs({ selected, onSelect }: ShopTabsProps): ReactElement {
  return (
    <div className="shop-tabs" role="tablist" aria-label="Shop sections">
      {TABS.map((kind) => (
        <button
          key={kind}
          id={tabId(kind)}
          className="shop-tab"
          role="tab"
          aria-selected={kind === selected}
          aria-controls="shop-items"
          onClick={() => onSelect(kind)}
        >
          {TAB_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}

/** The shop slides in from the left: crops and decorations on two tabs. Picking an item starts build mode with it. */
export function ShopPanel(): ReactElement {
  const [tab, setTab] = useState<ShopKind>('crop');
  return (
    <SidePanel panel="shop" className="shop-panel">
      <header className="side-panel-header">
        <h2 id={panelTitleId('shop')} className="shop-title">
          Shop
        </h2>
        <PanelCloseButton />
      </header>
      <ShopTabs selected={tab} onSelect={setTab} />
      <div id="shop-items" className="shop-items" role="tabpanel" aria-labelledby={tabId(tab)}>
        {SHOP_ITEMS[tab].map((item) => (
          <ShopTile key={item.id} item={item} />
        ))}
      </div>
    </SidePanel>
  );
}
