"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const DEBOUNCE_MS = 500;

/**
 * Maintains local state for a text field and debounces persistence.
 * Prevents async store updates from overwriting in-progress typing.
 */
export function useDebouncedField(
  externalValue: string,
  save: (value: string) => void
) {
  const [localValue, setLocalValue] = useState(externalValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);
  const isLocalEdit = useRef(false);

  // Sync from external when not in the middle of a local edit.
  // Handles AI Refine, score updates, etc.
  useEffect(() => {
    if (!isLocalEdit.current) {
      setLocalValue(externalValue);
    }
  }, [externalValue]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (pendingRef.current !== null) {
        save(pendingRef.current);
        pendingRef.current = null;
      }
      isLocalEdit.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback(
    (value: string) => {
      setLocalValue(value);
      pendingRef.current = value;
      isLocalEdit.current = true;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        if (pendingRef.current !== null) {
          save(pendingRef.current);
          pendingRef.current = null;
          isLocalEdit.current = false;
        }
      }, DEBOUNCE_MS);
    },
    [save]
  );

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current !== null) {
      save(pendingRef.current);
      pendingRef.current = null;
      isLocalEdit.current = false;
    }
  }, [save]);

  return { localValue, onChange, flush };
}
