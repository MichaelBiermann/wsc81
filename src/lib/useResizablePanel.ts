"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const MIN_WIDTH = 280;
const MAX_WIDTH = 900;

export function useResizablePanel(storageKey: string, defaultWidth: number) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === "undefined") return defaultWidth;
    const stored = localStorage.getItem(storageKey);
    return stored ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(stored))) : defaultWidth;
  });

  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - ev.clientX));
      setWidth(newWidth);
    }

    function onMouseUp() {
      dragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, String(width));
  }, [storageKey, width]);

  return { width, onMouseDown };
}
