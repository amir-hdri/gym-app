import { describe, expect, it } from "vitest";
import { DOCK_MAX, partitionNav, type NavItem } from "./nav-items";

const item = (href: string, extra: Partial<NavItem> = {}): NavItem => ({
  label: href,
  href,
  icon: null,
  ...extra,
});

describe("partitionNav", () => {
  it("fills the dock with the routes that opt in, in list order", () => {
    const items = [
      item("/a"),
      item("/b", { dockIcon: "home" }),
      item("/c"),
      item("/d", { dockIcon: "workout" }),
      item("/e", { dockIcon: "checkin" }),
      item("/f", { dockIcon: "progress" }),
      item("/g", { dockIcon: "athlete" }),
    ];

    const { dock, sheet } = partitionNav(items);

    expect(dock.map((i) => i.href)).toEqual(["/b", "/d", "/e", "/f", "/g"]);
    expect(sheet.map((i) => i.href)).toEqual(items.map((i) => i.href));
  });

  it("caps the dock at DOCK_MAX even when more routes opt in", () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      item(`/r${i}`, { dockIcon: "home" })
    );

    expect(partitionNav(items).dock).toHaveLength(DOCK_MAX);
  });

  it("returns an empty dock when no route opts in, keeping the drawer whole", () => {
    // An empty dock is honest: the drawer still reaches everything. A fallback
    // dock built from routes without glyphs would render an empty <nav> —
    // every entry resolves to null in the shell.
    const items = [item("/a"), item("/b")];

    const { dock, sheet } = partitionNav(items);

    expect(dock).toEqual([]);
    expect(sheet.map((i) => i.href)).toEqual(["/a", "/b"]);
  });

  it("keeps every visible route in the drawer, docked ones included", () => {
    // The drawer is the "all sections" view. Dropping docked routes from it
    // would hide them from the one screen that promises everything.
    const items = [
      item("/a", { dockIcon: "home" }),
      item("/b"),
      item("/c", { dockIcon: "workout" }),
    ];

    expect(partitionNav(items).sheet.map((i) => i.href)).toEqual(["/a", "/b", "/c"]);
  });

  it("omits hidden routes from both surfaces", () => {
    // `hidden` wins over `dockIcon`: an alias suppressed from the drawer must
    // not survive in the dock, or it becomes reachable only through an icon.
    const items = [
      item("/visible"),
      item("/secret", { hidden: true, dockIcon: "home" }),
      item("/other", { dockIcon: "workout" }),
    ];

    const { dock, sheet } = partitionNav(items);

    expect(sheet.map((i) => i.href)).toEqual(["/visible", "/other"]);
    expect(dock.map((i) => i.href)).toEqual(["/other"]);
  });

  it("returns empty surfaces for an empty portal", () => {
    expect(partitionNav([])).toEqual({ dock: [], sheet: [] });
  });

  it("leaves no route unreachable from both surfaces", () => {
    const items = Array.from({ length: 9 }, (_, i) =>
      item(`/r${i}`, i % 2 === 0 ? { dockIcon: "home" as const } : {})
    );

    const { dock, sheet } = partitionNav(items);
    const reachable = new Set([...dock, ...sheet].map((i) => i.href));

    expect(reachable.size).toBe(items.length);
  });
});