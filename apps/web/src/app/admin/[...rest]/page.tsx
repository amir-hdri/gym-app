import AdminNotFound from "../not-found";

/** Catch-all for unmatched routes under the admin portal — see athlete. */
export default function AdminCatchAll() {
  return <AdminNotFound />;
}
