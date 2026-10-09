"use client";

import { PortalErrorView } from "@/components/layout/PortalErrorView";

/** Coach-portal error boundary — keeps the shell (dock/header) mounted. */
export default function CoachError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <PortalErrorView error={error} retry={retry} />;
}
