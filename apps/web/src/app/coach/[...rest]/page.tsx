import CoachNotFound from "../not-found";

/** Catch-all for unmatched routes under the coach portal — see athlete. */
export default function CoachCatchAll() {
  return <CoachNotFound />;
}
