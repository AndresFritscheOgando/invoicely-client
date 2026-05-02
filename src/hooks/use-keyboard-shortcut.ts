import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { metaOrCtrl?: boolean } = {}
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const modifierHeld = options.metaOrCtrl ? (e.metaKey || e.ctrlKey) : true;
      if (modifierHeld && e.key === key) {
        e.preventDefault();
        callback();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [key, callback, options.metaOrCtrl]);
}
