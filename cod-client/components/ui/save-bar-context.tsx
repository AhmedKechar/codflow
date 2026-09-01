"use client";

import { createContext, useContext, useState, useCallback, useRef, useMemo, type ReactNode } from "react";

interface SaveBarEntry {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
}

interface SaveBarContextValue {
  register: (id: string, entry: SaveBarEntry) => void;
  unregister: (id: string) => void;
  active: SaveBarEntry | null;
}

const SaveBarContext = createContext<SaveBarContextValue | null>(null);

export function useSaveBar() {
  return useContext(SaveBarContext);
}

export function SaveBarProvider({ children }: { children: ReactNode }) {
  const entriesRef = useRef<Map<string, SaveBarEntry>>(new Map());
  const [active, setActive] = useState<SaveBarEntry | null>(null);

  const register = useCallback((_id: string, entry: SaveBarEntry) => {
    entriesRef.current.set(_id, entry);

    let found: SaveBarEntry | null = null;
    for (const [, e] of entriesRef.current) {
      if (e.isDirty || e.isSaving) {
        found = e;
        break;
      }
    }

    setActive((prev) => {
      if (prev === found) return prev;
      if (prev && found && prev.isDirty === found.isDirty && prev.isSaving === found.isSaving) return prev;
      return found;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    entriesRef.current.delete(id);

    let found: SaveBarEntry | null = null;
    for (const [, e] of entriesRef.current) {
      if (e.isDirty || e.isSaving) {
        found = e;
        break;
      }
    }

    setActive((prev) => {
      if (prev === found) return prev;
      if (prev && found && prev.isDirty === found.isDirty && prev.isSaving === found.isSaving) return prev;
      return found;
    });
  }, []);

  const value = useMemo(() => ({ register, unregister, active }), [register, unregister, active]);

  return (
    <SaveBarContext.Provider value={value}>
      {children}
    </SaveBarContext.Provider>
  );
}
