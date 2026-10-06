import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CROP_SLOTS, WHEEL_SPOTS, initialState } from '../game/index.ts';
import { setSources } from '../state/clock.ts';
import { useStore } from '../state/store.ts';
import { Hud } from './Hud.tsx';

/** A roll that lands in the middle of spot i. */
const rollFor = (i: number): number => (i + 0.5) / WHEEL_SPOTS;

function loadGame(filledSlots: number): void {
  const filled = Array.from({ length: CROP_SLOTS }, (_, i) => i < filledSlots);
  useStore.setState({ game: { ...initialState(), wheel: { filled } }, openPanel: null, isWheelSpinning: false });
}

function sidePanel(): HTMLElement {
  return screen.getByRole('complementary', { name: /^Level/ });
}

describe('side panel', () => {
  beforeEach(() => {
    // The wheel turns on a setTimeout; faking only that lets the test decide when it stops.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    setSources({ roll: () => rollFor(0) });
    loadGame(1);
  });

  afterEach(() => {
    vi.useRealTimers();
    setSources({ roll: () => Math.random() });
  });

  function setup(): ReturnType<typeof userEvent.setup> {
    render(<Hud />);
    return userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
  }

  it('opens with the star and closes with Esc', async () => {
    const user = setup();
    expect(sidePanel()).toHaveAttribute('data-state', 'closed');

    await user.click(screen.getByRole('button', { name: /^Wheel/ }));
    expect(sidePanel()).toHaveAttribute('data-state', 'open');

    await user.keyboard('{Escape}');
    expect(sidePanel()).toHaveAttribute('data-state', 'closed');
  });

  it('stays open while the wheel is spinning', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /^Wheel/ }));
    await user.click(screen.getByRole('button', { name: /^Spin/ }));
    expect(screen.getByRole('img', { name: 'Wheel' })).toHaveAttribute('data-state', 'spinning');

    await user.keyboard('{Escape}');
    expect(sidePanel()).toHaveAttribute('data-state', 'open');

    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByRole('img', { name: 'Wheel' })).toHaveAttribute('data-state', 'result');
    expect(screen.getByRole('status')).toHaveTextContent('Win! −1 spin');

    await user.keyboard('{Escape}');
    expect(sidePanel()).toHaveAttribute('data-state', 'closed');
  });
});

describe('star badge', () => {
  it('shows when a spin is possible', () => {
    loadGame(1);
    render(<Hud />);
    expect(screen.getByRole('button', { name: 'Wheel (ready to spin)' })).toBeInTheDocument();
    expect(screen.getByTestId('spin-badge')).toBeInTheDocument();
  });

  it('is hidden when no slot is filled', () => {
    loadGame(0);
    render(<Hud />);
    expect(screen.getByRole('button', { name: 'Wheel' })).toBeInTheDocument();
    expect(screen.queryByTestId('spin-badge')).not.toBeInTheDocument();
  });
});
