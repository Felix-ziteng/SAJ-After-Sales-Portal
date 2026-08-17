"use client";

import { useEffect, useState } from "react";

/** Like `useState`, but remembers the last value in `localStorage` under `key` (used for the
 * dashboard filter bars — "remember my last filter selection"). Reads the persisted value
 * synchronously via the lazy initializer (matching this app's existing pattern for other
 * browser-only reads, e.g. `ConfirmationLinkCard`'s `window.location.origin` check) rather than
 * loading it in an effect, which would call `setState` from inside the effect body. */
export function usePersistedState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (e.g. private browsing quota) — filter still works, just not remembered.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
