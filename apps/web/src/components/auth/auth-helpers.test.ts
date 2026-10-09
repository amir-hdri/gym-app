import { describe, expect, it } from "vitest";
import {
  classifyResetFailure,
  httpStatusOf,
  isValidStoredUser,
  homeForRole,
} from "./auth-helpers";

describe("isValidStoredUser", () => {
  it("accepts a user with the fields the consumers rely on", () => {
    expect(
      isValidStoredUser({
        id: "u1",
        role: "athlete",
        firstName: "علی",
        lastName: "محمدی",
      })
    ).toBe(true);
  });

  it("accepts every role", () => {
    for (const role of ["admin", "receptionist", "coach", "athlete"]) {
      expect(isValidStoredUser({ id: "u1", role })).toBe(true);
    }
  });

  it("rejects non-object and null", () => {
    expect(isValidStoredUser(null)).toBe(false);
    expect(isValidStoredUser(undefined)).toBe(false);
    expect(isValidStoredUser("u1")).toBe(false);
    expect(isValidStoredUser(42)).toBe(false);
  });

  it("rejects an unknown or typed-wrong role", () => {
    expect(isValidStoredUser({ id: "u1", role: "superadmin" })).toBe(false);
    expect(isValidStoredUser({ id: "u1", role: 7 })).toBe(false);
    expect(isValidStoredUser({ id: "u1" })).toBe(false);
  });

  it("rejects a user without an id or with a wrong-typed id", () => {
    expect(isValidStoredUser({ role: "athlete" })).toBe(false);
    expect(isValidStoredUser({ id: 7, role: "athlete" })).toBe(false);
  });

  it("is narrow enough to use as a type guard", () => {
    const value: unknown = { id: "u1", role: "coach" };
    if (isValidStoredUser(value)) {
      // `value` is now narrowed: reading these compiles without casts.
      expect(value.id).toBe("u1");
      expect(value.role).toBe("coach");
    }
  });
});

describe("homeForRole", () => {
  it("maps each role to its portal root", () => {
    expect(homeForRole("athlete")).toBe("/athlete");
    expect(homeForRole("coach")).toBe("/coach");
    expect(homeForRole("admin")).toBe("/admin");
    expect(homeForRole("receptionist")).toBe("/admin");
  });
});

describe("httpStatusOf and classifyResetFailure", () => {
  it("extracts the HTTP status from an axios-like rejection", () => {
    expect(httpStatusOf({ response: { status: 422 } })).toBe(422);
    expect(httpStatusOf(new Error("boom"))).toBeUndefined();
    expect(httpStatusOf(null)).toBeUndefined();
  });

  it("classifies dead-token vs rejected-password resets", () => {
    expect(classifyResetFailure({ response: { status: 400 } })).toBe("token");
    expect(classifyResetFailure({ response: { status: 422 } })).toBe("password");
    expect(classifyResetFailure(new Error("لینک منقضی شده"))).toBe("token");
    expect(classifyResetFailure(new Error("weird"))).toBe("unknown");
  });
});
