import type { UserRole } from "@/lib/types";

/**
 * True when a parsed `auth_user` entry has the shape a consumer can rely on.
 *
 * `localStorage` survives schema changes and hand-edits; `as User` is a claim,
 * not a check. Used by `AuthProvider` on restore so a stale shape is cleared
 * instead of flowing into every `user.firstName` read and `user.role` switch.
 * Extracted to a predicate so the contract is unit-testable.
 */
export function isValidStoredUser(value: unknown): value is {
  id: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
} {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { id?: unknown; role?: unknown };
  return (
    typeof candidate.id === "string" &&
    typeof candidate.role === "string" &&
    ["admin", "receptionist", "coach", "athlete"].includes(candidate.role)
  );
}

/**
 * Where a signed-in user belongs. `receptionist` shares the admin shell —
 * `app/admin/layout.tsx` admits both roles — so there is no separate route.
 */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "admin":
    case "receptionist":
      return "/admin";
    case "coach":
      return "/coach";
    case "athlete":
      return "/athlete";
  }
}

export function panelLabelForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "پنل مدیریت";
    case "receptionist":
      return "پنل پذیرش";
    case "coach":
      return "پنل مربی";
    case "athlete":
      return "پنل ورزشکار";
  }
}

/**
 * Mirrors the server-side policy (min 8 characters, at least one letter and one
 * digit). Validating it client-side turns an opaque 422 into an inline hint.
 */
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_LENGTH_MESSAGE = "رمز عبور باید حداقل ۸ کاراکتر باشد";
export const PASSWORD_PATTERN_MESSAGE = "رمز عبور باید شامل حرف و رقم باشد";
export const PASSWORD_HINT = "حداقل ۸ کاراکتر، شامل حرف و رقم";

interface HttpErrorShape {
  response?: { status?: number; data?: { error?: string; message?: string } };
}

/** The status of a failed request, when the failure came from one. */
export function httpStatusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const status = (error as HttpErrorShape).response?.status;
  return typeof status === "number" ? status : undefined;
}

/**
 * Best Persian message for a failed mutation.
 *
 * Three shapes reach here: an axios rejection carrying the backend envelope
 * (`{ success: false, error }`), a plain `Error` thrown by the mock service, and
 * anything unexpected. FastAPI's own 422 body is a machine-readable `detail`
 * array, which is why that status gets `fallback` instead of its own text.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const envelope = (error as HttpErrorShape).response?.data;
    const fromEnvelope = envelope?.error ?? envelope?.message;
    // The backend answers in English; only the mock speaks Persian. Showing an
    // English sentence inside a Persian form is worse than the fallback.
    if (fromEnvelope && /[؀-ۿ]/.test(fromEnvelope)) return fromEnvelope;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export type ResetFailure = "token" | "password" | "unknown";

/**
 * Splits a reset-password failure into the two kinds that need different
 * recovery: a dead token (ask for a new link) and a rejected password (fix the
 * field).
 *
 * The backend answers 400 for the former and 422 for the latter. The mock
 * service is not an HTTP client and throws status-less `Error`s, so those are
 * classified from the message — every token failure it raises names the link.
 */
export function classifyResetFailure(error: unknown): ResetFailure {
  const status = httpStatusOf(error);
  if (status === 400) return "token";
  if (status === 422) return "password";
  if (status === undefined && error instanceof Error && error.message.includes("لینک")) {
    return "token";
  }
  return "unknown";
}
