"use client";

import { useEffect } from "react";

/** Every page here is a Client Component, so per-route `metadata` exports aren't an option —
 * this sets the browser tab title imperatively instead, restoring whatever it was before on
 * unmount so navigating away doesn't leave a stale title behind. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · After-Sales Portal`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
