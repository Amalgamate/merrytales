import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Node.js 26 exposes an experimental `localStorage` that is `undefined`,
// which shadows jsdom's implementation. Override it here.
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  });
}
