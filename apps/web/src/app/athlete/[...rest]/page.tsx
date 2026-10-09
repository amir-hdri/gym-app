import AthleteNotFound from "../not-found";

/**
 * Catch-all for unmatched routes under the athlete portal.
 *
 * A URL like `/athlete/stale/deep-link` does not fire the segment
 * `not-found.tsx` — Next renders the *root* 404 instead, tearing down the
 * shell. This catch-all matches any unknown path and renders the portal 404
 * inside the shell, so the dock survives even a stale deep link.
 */
export default function AthleteCatchAll() {
  return <AthleteNotFound />;
}
