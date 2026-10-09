/**
 * Portal navigation: the shared shape plus the one rule that keeps the dock
 * and the drawer from disagreeing.
 *
 * Portal layouts render two views of the same routes — a fixed, icon-only dock
 * (always visible, at most `DOCK_MAX` entries) and a full sheet drawer (every
 * route, labelled). Both derive from a single list here, because they used to
 * be a hand-copied table per role and had drifted: the dock said "داشبورد خانه"
 * where the drawer said "داشبورد", and five of the athlete's ten routes were
 * reachable only through the drawer with no way to tell which section was
 * current.
 */

/**
 * Dock glyphs are named, not referenced.
 *
 * These lists are built in Server Components and handed to a Client Component,
 * and React cannot serialise a component *function* across that boundary. A
 * rendered element (`icon: <X />`) is fine; a function is not. Naming the glyph
 * and resolving it inside the client shell keeps the RSC payload serialisable.
 */
export type NavIconName =
  | "home"
  | "workout"
  | "checkin"
  | "progress"
  | "athlete";

export interface NavItem {
  label: string;
  href: string;
  /** Glyph for the sheet drawer. A rendered element, so it is serialisable. */
  icon: React.ReactNode;
  /**
   * Marks a route as dock-worthy and names its dock glyph. Routes without one
   * stay reachable through the drawer — that is what the drawer is for — so a
   * route is dock-worthy only when this is present.
   */
  dockIcon?: NavIconName;
  /** Omit from the drawer, for alias routes reached some other way. */
  hidden?: boolean;
  active?: boolean;
  badge?: number;
  subItems?: NavItem[];
}

/** Highest number of entries the fixed dock holds without crowding. */
export const DOCK_MAX = 5;

/**
 * Splits a portal's routes into dock entries and drawer entries.
 *
 * The dock holds the routes that opt in with `dockIcon`, in list order, up to
 * `DOCK_MAX`. A portal that declares none simply has no dock — the header
 * button's drawer still reaches every route, so inventing dock entries whose
 * glyphs do not exist would trade an empty dock for a broken-looking one.
 *
 * The drawer lists every visible route *including* the docked ones — it is
 * the "all sections" view, and a route reachable only from a five-slot dock
 * would otherwise be invisible on the very screen that promises everything.
 */
export function partitionNav(items: NavItem[]): {
  dock: NavItem[];
  sheet: NavItem[];
} {
  // `hidden` wins over `dockIcon`: an alias route that is suppressed from the
  // drawer must not surface in the dock either, or it becomes reachable only
  // through an icon with no label anywhere else.
  const opted = items.filter((item) => item.dockIcon && !item.hidden);
  const dock = opted.length > 0 ? opted.slice(0, DOCK_MAX) : [];

  return {
    dock,
    sheet: items.filter((item) => !item.hidden),
  };
}