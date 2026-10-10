"use client";

/**
 * Deterministic focus return for modal layers (WCAG 2.4.3).
 *
 * Radix restores focus to the dialog invoker on close, but the restore lands
 * on `<body>` whenever the opener is gone by close time — e.g. a dropdown
 * menu item that unmounts when its menu closes as the sheet opens. That drops
 * keyboard users at the top of the page.
 *
 * This module remembers the most recent focus target that lives outside any
 * transient layer (dialog / menu / listbox), so a closing layer can fall back
 * to it when its direct invoker is `<body>` or disconnected.
 */

let lastOutside: HTMLElement | null = null;
let installed = false;

const TRANSIENT_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

export function installFocusTracker() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener("focusin", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && !target.closest(TRANSIENT_SELECTOR)) {
      lastOutside = target;
    }
  });
}

/**
 * Preferred restore target for a closing layer: the captured invoker when it
 * is still a meaningful, mounted element, otherwise the last focus outside
 * any transient layer, otherwise null (leave the platform default alone).
 */
export function takeRestoreTarget(preferred: HTMLElement | null): HTMLElement | null {
  if (preferred && preferred.isConnected && preferred !== document.body) return preferred;
  if (lastOutside && lastOutside.isConnected && lastOutside !== document.body) return lastOutside;
  return null;
}
