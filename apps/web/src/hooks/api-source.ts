/**
 * Shared foundation for the data hooks: where data comes from (real API vs.
 * mock), the query-key map, and the cache helpers the optimistic mutations use.
 *
 * It lives in its own module so `use-api.ts`, `use-messages.ts` and
 * `use-analytics.ts` can all reach it without importing each other — a cycle
 * between them would be evaluated at module-init time, which is exactly when
 * the mock proxy below is constructed.
 *
 * Nothing here may statically import `@/lib/mock-service` or `axios`. The mock
 * fixtures are reached through the lazy `import()` proxy, and the API client
 * through the lazy facade in `@/lib/api`; both keep that weight out of the
 * bundles that production users download.
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { ApiResponse, PaginatedResponse } from "@/lib/types";

// Toggle: set NEXT_PUBLIC_USE_MOCKS=true to keep mock data in dev.
// Default is real API.
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// The mock layer (~20KB of fixtures) is dev-only. Resolve it through a lazy
// proxy so the bundler emits a separate chunk that production users never load.
type MockService = typeof import("@/lib/mock-service").mockService;
type MockServiceKeys = keyof MockService;
let mockLoader: Promise<MockService> | undefined;
function loadMockService(): Promise<MockService> {
  mockLoader ??= import("@/lib/mock-service").then((m) => m.mockService);
  return mockLoader;
}
export const mockService = new Proxy({} as MockService, {
  get(_target, prop: MockServiceKeys) {
    return (...args: unknown[]) =>
      loadMockService().then((service) => (service[prop] as (...a: unknown[]) => unknown)(...args));
  },
});

/**
 * The signed-in user's id, read from the entry `AuthProvider` writes — local
 * for remembered sessions, session storage for short ones (the same places
 * `api-client` reads its tokens from).
 *
 * The real API infers the caller from the bearer token, but two things here
 * need it client-side: the mock service, which takes no token, and the
 * optimistic cache writes, which have to know whose message or read-receipt
 * they are faking.
 */
export function currentUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = store.getItem("auth_user");
      if (!raw) continue;
      const id = (JSON.parse(raw) as { id?: string }).id;
      if (id) return id;
    } catch {
      continue;
    }
  }
  return undefined;
}

/** Mock-mode equivalent of "the caller", for routes that need one. */
export function requireUserId(): string {
  const id = currentUserId();
  if (!id) throw new Error("برای این عملیات باید وارد حساب خود شوید");
  return id;
}

export const Q = {
  dashboardStats: ["dashboard", "stats"] as const,
  athleteDashboard: (id: string) => ["athlete", "dashboard", id] as const,
  coachDashboard: (id: string) => ["coach", "dashboard", id] as const,
  users: (role?: string) => ["users", role || "all"] as const,
  user: (id: string) => ["user", id] as const,
  branches: ["branches"] as const,
  plans: ["plans"] as const,
  plan: (id: string) => ["plan", id] as const,
  memberships: ["memberships"] as const,
  membership: (id: string) => ["membership", id] as const,
  exercises: ["exercises"] as const,
  exercise: (id: string) => ["exercise", id] as const,
  programs: ["programs"] as const,
  program: (id: string) => ["program", id] as const,
  goals: (athleteId?: string) => ["goals", athleteId || "all"] as const,
  goal: (id: string) => ["goal", id] as const,
  checkIns: (userId?: string) => ["checkins", userId || "all"] as const,
  payments: (userId?: string) => ["payments", userId || "all"] as const,
  payment: (id: string) => ["payment", id] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  profile: ["profile"] as const,
  // Messaging. The unread badge gets its own root key so a broad invalidation
  // of ["messages"] cannot be mistaken for a message list by a cache patcher.
  conversations: (userId?: string) => ["conversations", userId || "all"] as const,
  conversation: (id: string) => ["conversation", id] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
  unreadMessages: (userId?: string) => ["messages-unread", userId || "all"] as const,
  // Analytics.
  attendanceTrend: (days: number) => ["analytics", "attendance-trend", days] as const,
  revenueTrend: (months: number) => ["analytics", "revenue-trend", months] as const,
  // Separate entry from `revenueTrend` on purpose: same underlying payments,
  // different shape and window, so they must not share a cache slot.
  revenueSeries: (period: string, months: number) => ["analytics", "revenue-series", period, months] as const,
  membershipDistribution: ["analytics", "membership-distribution"] as const,
  peakHours: (days: number) => ["analytics", "peak-hours", days] as const,
  athleteActivity: (athleteId: string, days: number) => ["analytics", "athlete-activity", athleteId, days] as const,
};

// ===========================================================================
// Optimistic-update helpers
// ===========================================================================
// The contract every optimistic mutation here follows:
//
//   onMutate   cancel in-flight fetches (so a slow response cannot land on top
//              of the optimistic value), snapshot, patch, return the snapshot
//   onError    restore the snapshot
//   onSettled  invalidate, so the server's version wins in the end
//
// `patch*Queries` deliberately leave an entry untouched when it holds no data
// yet. That keeps `restoreQueries` sound: a patch never *creates* a cache
// entry, so rolling back never has to delete one.

export type QuerySnapshot = [QueryKey, unknown][];

/** Snapshots every cached entry under `queryKey`, for a later rollback. */
export function snapshotQueries(qc: QueryClient, queryKey: QueryKey): QuerySnapshot {
  return qc.getQueriesData({ queryKey });
}

/** Puts back what `snapshotQueries` captured. */
export function restoreQueries(qc: QueryClient, snapshot: QuerySnapshot | undefined): void {
  snapshot?.forEach(([key, data]) => {
    if (data !== undefined) qc.setQueryData(key, data);
  });
}

/** Maps over the `data` array of every cached list response under `queryKey`. */
export function patchListQueries<T>(
  qc: QueryClient,
  queryKey: QueryKey,
  map: (items: T[]) => T[],
): void {
  qc.setQueriesData<PaginatedResponse<T>>({ queryKey }, (old) =>
    old?.data ? { ...old, data: map(old.data) } : old);
}

/** Maps over the `data` object of every cached single-object response under `queryKey`. */
export function patchItemQueries<T>(
  qc: QueryClient,
  queryKey: QueryKey,
  map: (item: T) => T,
): void {
  qc.setQueriesData<ApiResponse<T>>({ queryKey }, (old) =>
    old?.data ? { ...old, data: map(old.data) } : old);
}
