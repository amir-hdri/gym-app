/**
 * Mutation-failure messages for the coach portal.
 *
 * Two shapes reach the UI: an axios rejection carrying the backend envelope,
 * and a plain `Error` thrown by the mock service. `apiErrorMessage` in
 * `components/auth/auth-helpers` already picks the best of those; what it
 * cannot do is say what a 409 *means*, which differs per resource — so the
 * conflict text is supplied by the caller and everything else falls through.
 */
import { apiErrorMessage, httpStatusOf } from "@/components/auth/auth-helpers";

/**
 * Persian message for a failed write.
 *
 * `conflict` is the resource-specific text for a 409 (a referenced exercise, a
 * duplicate name) — the backend answers those in English, so the caller has to
 * supply the sentence a coach should read.
 */
export function mutationErrorMessage(
  error: unknown,
  fallback: string,
  conflict?: string
): string {
  if (conflict && httpStatusOf(error) === 409) return conflict;
  return apiErrorMessage(error, fallback);
}
