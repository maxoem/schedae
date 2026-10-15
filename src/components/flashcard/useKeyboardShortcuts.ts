import { useEffect, useCallback } from "react";

/**
 * Keyboard shortcut handler for IDE-style interactions.
 * Supports Ctrl+Enter (compile), Ctrl+S (export), Ctrl+M (focus markers).
 */
export function useKeyboardShortcuts({
  onCompile,
  onExport,
  onToggleMarkers,
}: {
  onCompile?: () => void;
  onExport?: () => void;
  onToggleMarkers?: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl+Enter = compile
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onCompile?.();
        return;
      }
      // Ctrl+S = save/export
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onExport?.();
        return;
      }
      // Ctrl+M = toggle markers panel
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        onToggleMarkers?.();
        return;
      }
    },
    [onCompile, onExport, onToggleMarkers],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
