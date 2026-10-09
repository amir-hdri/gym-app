"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useNotifications, useUnreadMessageCount } from "@/hooks/use-api";

export interface PortalBadgeCounts {
  messages: number;
  notifications: number;
}

/**
 * Unread counts for the shell's two inbox destinations.
 *
 * Resolved here instead of in each portal's nav constants so all three portals
 * get the same live badge from one place. Header and the nav lists both call
 * it; React Query serves the second caller from the same cache entry, so the
 * duplication costs no extra request.
 *
 * A receptionist legitimately has no conversations — the API answers `0`
 * rather than failing — so a zero count is a normal result, not an error, and
 * simply hides the badge.
 */
export function usePortalBadgeCounts(): PortalBadgeCounts {
  const { user } = useAuth();
  const unreadMessages = useUnreadMessageCount(user?.id);
  const notifications = useNotifications(user?.id);

  return {
    messages: unreadMessages.data?.data?.count ?? 0,
    notifications: notifications.data?.data?.filter((item) => !item.isRead).length ?? 0,
  };
}
