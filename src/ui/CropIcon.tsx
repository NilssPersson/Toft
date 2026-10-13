import type { ReactElement } from 'react';
import { CROPS_BY_ID } from '../game/index.ts';
import type { CropId } from '../game/index.ts';

/** Icons are drawn in a 24×24 box. */
const ICON_SIZE = 24;
const CENTRE = ICON_SIZE / 2;
const STEM = '#4f8a3a';
const LEAF = '#6fb34f';
const LEAF_LIGHT = '#9fd36f';
const GRAIN = '#e3b53f';
const CARROT = '#ec8a34';
const PUMPKIN = '#e07a2a';
const PUMPKIN_RIB = '#c4611c';
const PETAL = '#f6cf3c';
const SEED = '#7a4b25';
const BERRY = '#9b3b6e';
const BERRY_SHINE = '#d78bb5';
const OUTLINE = '#3b3226';
const FALLBACK_COLOUR = '#c9bfae';

const WHEAT_GRAINS: readonly [number, number, number][] = [
  [10, 6, -30],
  [14, 6, 30],
  [10, 10, -30],
  [14, 10, 30],
  [10, 14, -30],
  [14, 14, 30],
];

function WheatIcon(): ReactElement {
  return (
    <g>
      <path d="M12 22 V4" stroke={STEM} strokeWidth={1.6} strokeLinecap="round" />
      {WHEAT_GRAINS.map(([x, y, angle]) => (
        <ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx={2}
          ry={3.2}
          fill={GRAIN}
          transform={`rotate(${angle} ${x} ${y})`}
        />
      ))}
      <ellipse cx={12} cy={3.5} rx={1.6} ry={2.6} fill={GRAIN} />
    </g>
  );
}

function CarrotIcon(): ReactElement {
  return (
    <g>
      <path d="M9 4 L12 9 L15 4 M12 2 V9" stroke={LEAF} strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M7 9 Q12 7 17 9 L12.8 22 Q12 23 11.2 22 Z" fill={CARROT} />
      <path d="M9 13 h2.5 M12.5 16 h2 M10.5 19 h2" stroke={PUMPKIN_RIB} strokeWidth={1} strokeLinecap="round" />
    </g>
  );
}

function LettuceIcon(): ReactElement {
  return (
    <g>
      <circle cx={7.5} cy={14} r={6} fill={LEAF} />
      <circle cx={16.5} cy={14} r={6} fill={LEAF} />
      <circle cx={12} cy={10} r={6.5} fill={LEAF_LIGHT} />
      <circle cx={12} cy={15} r={5} fill={LEAF} />
      <path d="M12 20 V11" stroke={LEAF_LIGHT} strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

function PumpkinIcon(): ReactElement {
  return (
    <g>
      <path d="M12 7 Q12 3 15 2" stroke={STEM} strokeWidth={2} strokeLinecap="round" fill="none" />
      <ellipse cx={7.5} cy={14} rx={5} ry={7} fill={PUMPKIN_RIB} />
      <ellipse cx={16.5} cy={14} rx={5} ry={7} fill={PUMPKIN_RIB} />
      <ellipse cx={12} cy={14} rx={5.5} ry={7.5} fill={PUMPKIN} />
    </g>
  );
}

const SUNFLOWER_PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function SunflowerIcon(): ReactElement {
  return (
    <g>
      {SUNFLOWER_PETAL_ANGLES.map((angle) => (
        <ellipse key={angle} cx={CENTRE} cy={5} rx={2.6} ry={4.2} fill={PETAL} transform={`rotate(${angle} 12 12)`} />
      ))}
      <circle cx={CENTRE} cy={CENTRE} r={4.5} fill={SEED} />
    </g>
  );
}

const BERRIES: readonly [number, number][] = [
  [8, 15],
  [16, 15],
  [12, 18.5],
  [12, 11.5],
];

function BerryIcon(): ReactElement {
  return (
    <g>
      <path d="M12 8 Q9 3 4 4 Q8 8 12 8 Z" fill={LEAF} />
      {BERRIES.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={4} fill={BERRY} />
          <circle cx={x - 1.3} cy={y - 1.3} r={1} fill={BERRY_SHINE} />
        </g>
      ))}
    </g>
  );
}

function BeanstalkIcon(): ReactElement {
  return (
    <g>
      <path d="M12 23 Q7 17 12 12 Q17 7 12 1" stroke={STEM} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <path d="M11 15 Q5 15 4 10 Q9 10 11 15 Z" fill={LEAF} />
      <path d="M13 9 Q19 9 20 4 Q15 4 13 9 Z" fill={LEAF} />
      <path d="M12.5 19 Q18 20 20 16 Q15 15 12.5 19 Z" fill={LEAF_LIGHT} />
    </g>
  );
}

const CROP_ICONS: Record<CropId, () => ReactElement> = {
  wheat: WheatIcon,
  carrot: CarrotIcon,
  lettuce: LettuceIcon,
  pumpkin: PumpkinIcon,
  sunflower: SunflowerIcon,
  berry: BerryIcon,
  beanstalk: BeanstalkIcon,
};

/** A plain disc in the crop's colour, for a crop that has no icon yet. */
function FallbackIcon({ cropId }: { cropId: CropId }): ReactElement {
  const colour = CROPS_BY_ID[cropId]?.color ?? FALLBACK_COLOUR;
  return <circle cx={CENTRE} cy={CENTRE} r={8} fill={colour} stroke={OUTLINE} strokeWidth={1} />;
}

/** A crop's icon as an SVG group in a 24×24 box, for use inside another SVG. */
export function CropIconGroup({ cropId }: { cropId: CropId }): ReactElement {
  const Icon = CROP_ICONS[cropId];
  return Icon ? <Icon /> : <FallbackIcon cropId={cropId} />;
}

export function cropName(cropId: CropId): string {
  return CROPS_BY_ID[cropId]?.name ?? cropId;
}

interface CropIconBadgeProps {
  cropId: CropId;
  isFilled: boolean;
}

/** A crop's icon on its own, named for screen readers as the crop and whether its slot is filled. */
export function CropIconBadge({ cropId, isFilled }: CropIconBadgeProps): ReactElement {
  const label = `${cropName(cropId)} (${isFilled ? 'filled' : 'needed'})`;
  return (
    <svg
      viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}
      className={`crop-icon ${isFilled ? 'is-filled' : ''}`}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <CropIconGroup cropId={cropId} />
    </svg>
  );
}
