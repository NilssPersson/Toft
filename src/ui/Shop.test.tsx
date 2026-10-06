import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { initialState } from '../game/index.ts';
import type { GameState } from '../game/index.ts';
import { setSources } from '../state/clock.ts';
import { useStore } from '../state/store.ts';
import type { BuildDraft } from '../state/store.ts';
import { BuildControls } from './BuildControls.tsx';
import { Hud } from './Hud.tsx';

const NOW = 1_000_000;
/** Well away from the player, the starting wall and the edge. */
const FREE_CELL = { x: 2, z: 2 };

function loadGame(game: Partial<GameState> = {}, buildDraft: BuildDraft | null = null): void {
  useStore.setState({ game: { ...initialState(), ...game }, openPanel: null, isWheelSpinning: false, buildDraft });
}

function fenceDraft(cell = FREE_CELL): BuildDraft {
  return { kind: 'decoration', itemId: 'wooden-fence', cell, rotation: 0 };
}

const shopPanel = (): HTMLElement => screen.getByRole('complementary', { name: 'Shop' });
const wheelPanel = (): HTMLElement => screen.getByRole('complementary', { name: /^Level/ });

describe('shop panel', () => {
  beforeEach(() => {
    setSources({ now: () => NOW });
    loadGame();
  });

  it('opens from the shop button and closes the ★ panel, and the ★ closes it again', async () => {
    const user = userEvent.setup();
    render(<Hud />);
    await user.click(screen.getByRole('button', { name: 'Wheel' }));
    expect(wheelPanel()).toHaveAttribute('data-state', 'open');

    await user.click(screen.getByRole('button', { name: 'Shop' }));
    expect(shopPanel()).toHaveAttribute('data-state', 'open');
    expect(wheelPanel()).toHaveAttribute('data-state', 'closed');

    await user.click(screen.getByRole('button', { name: 'Wheel' }));
    expect(wheelPanel()).toHaveAttribute('data-state', 'open');
    expect(shopPanel()).toHaveAttribute('data-state', 'closed');
  });

  it('switches between the crops and decorations tabs', async () => {
    const user = userEvent.setup();
    render(<Hud />);
    await user.click(screen.getByRole('button', { name: 'Shop' }));
    expect(screen.getByRole('tab', { name: 'Crops' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /^Carrot/ })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Decorations' }));
    expect(screen.getByRole('tab', { name: 'Decorations' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /^Wooden fence/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Carrot/ })).not.toBeInTheDocument();
  });

  it('shows a locked item with its level, and picking it does nothing', async () => {
    const user = userEvent.setup();
    render(<Hud />);
    await user.click(screen.getByRole('button', { name: 'Shop' }));
    const pumpkin = screen.getByRole('button', { name: /^Pumpkin/ });
    expect(pumpkin).toHaveTextContent('Level 5');
    expect(pumpkin).toHaveAttribute('aria-disabled', 'true');

    await user.click(pumpkin);
    expect(useStore.getState().buildDraft).toBeNull();
    expect(shopPanel()).toHaveAttribute('data-state', 'open');
  });

  it('picking an unlocked item closes the shop and starts build mode with it', async () => {
    const user = userEvent.setup();
    render(<Hud />);
    await user.click(screen.getByRole('button', { name: 'Shop' }));
    await user.click(screen.getByRole('button', { name: /^Carrot/ }));

    expect(shopPanel()).toHaveAttribute('data-state', 'closed');
    expect(useStore.getState().buildDraft).toMatchObject({ kind: 'crop', itemId: 'carrot', rotation: 0 });
    expect(screen.getByText('Drag to move · ✓ to build')).toHaveRole('status');
  });
});

describe('build controls', () => {
  beforeEach(() => {
    setSources({ now: () => NOW });
  });

  it('disables ✓ on an invalid cell and builds on a valid one', async () => {
    const wall = initialState().decorations[0] ?? { x: 0, z: 0 };
    loadGame({}, fenceDraft({ x: wall.x, z: wall.z }));
    const user = userEvent.setup();
    render(<BuildControls />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();

    act(() => {
      useStore.setState({ buildDraft: fenceDraft() });
    });
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(useStore.getState().game.decorations).toContainEqual(expect.objectContaining({ ...FREE_CELL }));
  });

  it('offers rotate only for items that turn', async () => {
    loadGame({}, fenceDraft());
    const user = userEvent.setup();
    render(<BuildControls />);
    await user.click(screen.getByRole('button', { name: 'Rotate' }));
    expect(useStore.getState().buildDraft?.rotation).toBe(90);

    useStore.setState({ buildDraft: { kind: 'crop', itemId: 'carrot', cell: FREE_CELL, rotation: 0 } });
    expect(await screen.findByRole('button', { name: 'Confirm' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Rotate' })).not.toBeInTheDocument();
  });

  it('Esc leaves build mode', async () => {
    loadGame({}, fenceDraft());
    const user = userEvent.setup();
    render(<Hud />);
    await user.keyboard('{Escape}');
    expect(useStore.getState().buildDraft).toBeNull();
  });

  it('arrow keys move the ghost one cell, R turns it and Enter builds', async () => {
    loadGame({}, fenceDraft());
    const user = userEvent.setup();
    render(<Hud />);
    await user.keyboard('{ArrowDown}');
    expect(useStore.getState().buildDraft?.cell).toEqual({ x: FREE_CELL.x, z: FREE_CELL.z + 1 });
    await user.keyboard('r');
    await user.keyboard('{Enter}');
    expect(useStore.getState().game.decorations.at(-1)).toMatchObject({
      x: FREE_CELL.x,
      z: FREE_CELL.z + 1,
      rotation: 90,
    });
    // Build mode carries on, on the next free cell the way the fence faces.
    expect(useStore.getState().buildDraft?.cell).toEqual({ x: FREE_CELL.x, z: FREE_CELL.z + 2 });
  });
});
