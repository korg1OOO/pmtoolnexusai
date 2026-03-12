import "@testing-library/jest-dom";

// Suppress React 18 act() warnings from async state updates in renderHook tests.
// These are false positives for hooks that trigger async effects.
const originalError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('act(')) return;
  originalError.call(console, ...args);
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => { },
      removeListener: () => { },
      addEventListener: () => { },
      removeEventListener: () => { },
      dispatchEvent: () => { },
    }),
  });
}

