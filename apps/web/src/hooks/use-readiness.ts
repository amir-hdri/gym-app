import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { USE_MOCK, mockService } from "./api-source";

function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function useReadiness(userId?: string) {
  const qc = useQueryClient();
  const day = today();
  const key = ["readiness", userId, day];
  const storageKey = `readiness:${userId}:${day}`;
  const query = useQuery({ queryKey: key, enabled: !!userId, queryFn: async () => USE_MOCK ? { success: true, data: { day, state: localStorage.getItem(storageKey) } } : api.getReadiness() });
  const mutation = useMutation({ mutationFn: async (state: string) => { if (!USE_MOCK) return api.saveReadiness(state); localStorage.setItem(storageKey, state); return { success: true, data: { day, state } }; }, onSuccess: data => { qc.setQueryData(key, data); qc.invalidateQueries({ queryKey: ["readiness", "history"] }); } });
  return { query, mutation };
}

/** Recent readiness rows for the energy/history view. Staff may pass a member id. */
export function useReadinessHistory(userId?: string, days = 14) {
  return useQuery({
    queryKey: ["readiness", "history", userId || "self", days],
    queryFn: () => USE_MOCK
      ? mockService.getReadinessHistory({ userId, days })
      : api.getReadinessHistory({ userId, days }),
  });
}
