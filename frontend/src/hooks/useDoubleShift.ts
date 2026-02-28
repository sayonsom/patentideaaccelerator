"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Detects a double-press of the Shift key within a time window.
 * Resets on any non-Shift keydown to prevent false triggers from
 * Shift+Tab, Shift+Enter, etc.
 */
export function useDoubleShift(onDoubleShift: () => void, enabled = true) {
  const lastShiftUpRef = useRef<number>(0);
  const keyBetweenRef = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Shift") {
      // Any non-Shift key pressed — reset the double-shift detector
      keyBetweenRef.current = true;
    }
  }, []);

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Shift") return;

      // If another key was pressed between shifts, reset
      if (keyBetweenRef.current) {
        keyBetweenRef.current = false;
        lastShiftUpRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const elapsed = now - lastShiftUpRef.current;

      if (elapsed < 400 && lastShiftUpRef.current > 0) {
        // Double-shift detected
        lastShiftUpRef.current = 0;
        onDoubleShift();
      } else {
        lastShiftUpRef.current = now;
      }

      keyBetweenRef.current = false;
    },
    [onDoubleShift]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);
}
