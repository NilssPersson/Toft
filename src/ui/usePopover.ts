import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface Popover {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  /** Wraps the button and its popover; a press outside it closes the popover. */
  containerRef: RefObject<HTMLDivElement | null>;
}

function isOutside(container: HTMLElement | null, event: Event): boolean {
  return container !== null && event.target instanceof Node && !container.contains(event.target);
}

/** Open/closed state for a menu: closes on Esc or on a press anywhere else. */
export function usePopover(): Popover {
  const [isOpen, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (isOutside(containerRef.current, event)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);
  return { isOpen, toggle: () => setOpen(!isOpen), close: () => setOpen(false), containerRef };
}
