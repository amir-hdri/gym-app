"use client";

import * as React from "react";

export interface TargetController<T> {
  /** The record the surface was opened for. Retained while it closes. */
  target: T | null;
  open: boolean;
  /** Opens the surface for `value`. */
  show: (value: T) => void;
  /** Closes it, keeping `target` so the exit animation still has its data. */
  hide: () => void;
  /** For a primitive's `onOpenChange`. */
  setOpen: (open: boolean) => void;
}

/**
 * State for a dialog or sheet that acts on one record.
 *
 * The record deliberately outlives the close: Radix keeps the panel mounted
 * until its exit animation finishes, so clearing the record on close would blank
 * the title mid-animation — and unmounting the whole surface would skip the
 * animation altogether (DESIGN_SYSTEM §4).
 */
export function useTarget<T>(): TargetController<T> {
  const [target, setTarget] = React.useState<T | null>(null);
  const [open, setOpen] = React.useState(false);

  const show = React.useCallback((value: T) => {
    setTarget(value);
    setOpen(true);
  }, []);

  const hide = React.useCallback(() => setOpen(false), []);

  return { target, open, show, hide, setOpen };
}
