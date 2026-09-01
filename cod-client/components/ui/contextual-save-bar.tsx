"use client";

import { useEffect, useRef } from "react";
import { useSaveBar } from "./save-bar-context";

interface ContextualSaveBarProps {
  id?: string;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onCancel?: () => void;
}

export function ContextualSaveBar({
  id = "default",
  hasChanges,
  isSaving,
  onSave,
  onDiscard,
  onCancel,
}: ContextualSaveBarProps) {
  const saveBar = useSaveBar();
  const saveBarRef = useRef(saveBar);
  saveBarRef.current = saveBar;

  const onSaveRef = useRef(onSave);
  const onDiscardRef = useRef(onDiscard);
  const onCancelRef = useRef(onCancel);

  onSaveRef.current = onSave;
  onDiscardRef.current = onDiscard;
  onCancelRef.current = onCancel;

  useEffect(() => {
    const sb = saveBarRef.current;
    if (!sb) return;

    sb.register(id, {
      isDirty: hasChanges,
      isSaving,
      onSave: (...args) => onSaveRef.current(...args),
      onDiscard: (...args) => onDiscardRef.current(...args),
      onCancel: (...args) => (onCancelRef.current ?? onDiscardRef.current)(...args),
    });

    return () => sb.unregister(id);
  }, [id, hasChanges, isSaving]);

  return null;
}
