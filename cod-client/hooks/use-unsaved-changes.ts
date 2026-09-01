"use client";

import { useState, useEffect, useCallback } from "react";

export function useUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const resetDirty = useCallback(() => setIsDirty(false), []);

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return { isDirty, markDirty, resetDirty };
}
