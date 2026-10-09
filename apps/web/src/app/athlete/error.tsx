"use client";

import { PortalErrorView } from "@/components/layout/PortalErrorView";

/** Athlete-portal error boundary — keeps the shell (dock/header) mounted. */
export default function AthleteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <PortalErrorView error={error} retry={retry} />;
}
