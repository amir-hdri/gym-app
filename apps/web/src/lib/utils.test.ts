import { describe, expect, it } from "vitest";
import { formatDateTime, parseApiDate } from "./utils";

describe("parseApiDate", () => {
  it("treats offset-less ISO datetimes as UTC, not local time", () => {
    // "2026-10-02T00:30:00" must be the UTC instant, regardless of TZ.
    expect(parseApiDate("2026-10-02T00:30:00").getTime()).toBe(Date.UTC(2026, 9, 2, 0, 30, 0));
  });

  it("keeps explicit offsets intact", () => {
    expect(parseApiDate("2026-10-02T00:30:00+03:30").getTime()).toBe(Date.UTC(2026, 9, 1, 21, 0, 0));
  });

  it("keeps the Z designator intact", () => {
    expect(parseApiDate("2026-10-02T00:30:00Z").getTime()).toBe(Date.UTC(2026, 9, 2, 0, 30, 0));
  });

  it("treats space-separated naive datetimes as UTC", () => {
    expect(parseApiDate("2026-10-02 00:30:00").getTime()).toBe(Date.UTC(2026, 9, 2, 0, 30, 0));
  });

  it("passes Date instances through unchanged", () => {
    const d = new Date(Date.UTC(2026, 9, 2));
    expect(parseApiDate(d)).toBe(d);
  });

  it("formatDateTime renders a naive string as the UTC instant", () => {
    // TZ-independent: both sides go through the same formatter.
    expect(formatDateTime("2026-10-02T00:30:00")).toBe(
      formatDateTime(new Date(Date.UTC(2026, 9, 2, 0, 30, 0)))
    );
  });
});
