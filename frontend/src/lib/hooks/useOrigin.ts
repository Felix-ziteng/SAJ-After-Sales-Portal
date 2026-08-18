"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => undefined;

/** `window.location.origin` doesn't exist during SSR — reading it via `typeof window` at render
 * time renders different text on the server vs. the client's first paint, which React flags as a
 * hydration mismatch. `useSyncExternalStore` is the React-blessed way to read a browser-only
 * value safely: it returns the empty server snapshot until after hydration, then swaps in the
 * real value (origin never changes during a page's lifetime, so no subscription is needed). */
export function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ""
  );
}
