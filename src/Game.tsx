import { StrictMode } from 'react';
import { App } from './App.tsx';

// Entry point for /play, mounted by Astro with client:only="react".
export function Game() {
  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}
