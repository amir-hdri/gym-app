import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { mockService } from "@/lib/mock-service";
import type {
  User, MembershipPlan, Exercise, TrainingProgram,
  Goal, Payment,
} from "@/lib/types";

// Toggle: set NEXT_PUBLIC_USE_MOCKS=true to keep mock data in dev.
// Default is real API.
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const Q = {
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
};

// === Dashboard ===
export function useDashboardStats() {
  return useQuery({
    queryKey: Q.dashboardStats,
    queryFn: () => USE_MOCK ? mockService.getDashboardStats() : api.getDashboardStats(),
  });
}

export function useAthleteDashboard(athleteId?: string) {
  return useQuery({
    queryKey: Q.athleteDashboard(athleteId || ""),
    queryFn: () => USE_MOCK ? mockService.getAthleteDashboard(athleteId || "") : api.getAthleteDashboard(athleteId || ""),
    enabled: !!athleteId,
  });
}

export function useCoachDashboard(coachId?: string) {
  return useQuery({
    queryKey: Q.coachDashboard(coachId || ""),
    queryFn: () => USE_MOCK ? mockService.getCoachDashboard(coachId || "") : api.getCoachDashboard(coachId || ""),
    enabled: !!coachId,
  });
}

// === Users ===
export function useUsers(role?: string) {
  return useQuery({
    queryKey: Q.users(role),
    queryFn: () => USE_MOCK
      ? mockService.getUsers(role)
      : api.getUsers(role ? { role } : undefined),
  });
}
export function useUser(id?: string) {
  return useQuery({
    queryKey: Q.user(id || ""),
    queryFn: () => USE_MOCK ? mockService.getUser(id || "") : api.getUser(id || ""),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => USE_MOCK ? mockService.createUser(data) : api.createUser(data as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}

// === Branches ===
export function useBranches() {
  return useQuery({ queryKey: Q.branches, queryFn: () => USE_MOCK ? mockService.getBranches() : api.getBranches() });
}

// === Plans ===
export function useMembershipPlans() {
  return useQuery({ queryKey: Q.plans, queryFn: () => USE_MOCK ? mockService.getMembershipPlans() : api.getMembershipPlans() });
}
export function useMembershipPlan(id?: string) {
  return useQuery({
    queryKey: Q.plan(id || ""),
    queryFn: () => USE_MOCK ? mockService.getMembershipPlan(id || "") : api.getMembershipPlan(id || ""),
    enabled: !!id,
  });
}
export function useCreateMembershipPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MembershipPlan>) => USE_MOCK ? mockService.createMembershipPlan(data) : api.createMembershipPlan(data as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

// === Memberships ===
export function useMemberships() {
  return useQuery({ queryKey: Q.memberships, queryFn: () => USE_MOCK ? mockService.getMemberships() : api.getMemberships() });
}
export function useMembership(id?: string) {
  return useQuery({
    queryKey: Q.membership(id || ""),
    queryFn: () => USE_MOCK ? mockService.getMembership(id || "") : api.getMembership(id || ""),
    enabled: !!id,
  });
}

// === Exercises ===
export function useExercises() {
  return useQuery({ queryKey: Q.exercises, queryFn: () => USE_MOCK ? mockService.getExercises() : api.getExercises() });
}
export function useExercise(id?: string) {
  return useQuery({
    queryKey: Q.exercise(id || ""),
    queryFn: () => USE_MOCK ? mockService.getExercise(id || "") : api.getExercise(id || ""),
    enabled: !!id,
  });
}
export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Exercise>) => USE_MOCK ? mockService.createExercise(data) : api.createExercise(data as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

// === Training Programs ===
export function useTrainingPrograms() {
  return useQuery({ queryKey: Q.programs, queryFn: () => USE_MOCK ? mockService.getTrainingPrograms() : api.getTrainingPrograms() });
}
export function useTrainingProgram(id?: string) {
  return useQuery({
    queryKey: Q.program(id || ""),
    queryFn: () => USE_MOCK ? mockService.getTrainingProgram(id || "") : api.getTrainingProgram(id || ""),
    enabled: !!id,
  });
}
export function useCreateTrainingProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingProgram>) => USE_MOCK ? mockService.createTrainingProgram(data) : api.createTrainingProgram(data as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });
}
export function useCompleteProgramExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, exerciseId, data }: { programId: string; exerciseId: string; data?: Record<string, unknown> }) =>
      USE_MOCK
        ? mockService.completeProgramExercise(exerciseId)
        : api.completeProgramExercise(programId, exerciseId, data || {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });
}

// legacy single-arg callers (athlete workout row): fall back to program sniffing not needed; we update those callers
export function useCompleteProgramExerciseLegacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) => mockService.completeProgramExercise(exerciseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });
}

// === Goals ===
export function useGoals(athleteId?: string) {
  return useQuery({
    queryKey: Q.goals(athleteId),
    queryFn: () => USE_MOCK ? mockService.getGoals(athleteId) : api.getGoals(athleteId ? { athleteId } : undefined),
  });
}
export function useGoal(id?: string) {
  return useQuery({
    queryKey: Q.goal(id || ""),
    queryFn: () => USE_MOCK ? mockService.getGoal(id || "") : api.getGoal(id || ""),
    enabled: !!id,
  });
}
export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Goal>) => USE_MOCK ? mockService.createGoal(data) : api.createGoal(data as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
export function useUpdateGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) =>
      USE_MOCK ? mockService.updateGoalProgress(id, currentValue) : api.updateGoalProgress(id, currentValue),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

// === Check-ins ===
export function useCheckIns(userId?: string) {
  return useQuery({
    queryKey: Q.checkIns(userId),
    queryFn: () => USE_MOCK ? mockService.getCheckIns(userId) : api.getCheckIns(userId ? { userId } : undefined),
  });
}
export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; branchId: string }) => USE_MOCK ? mockService.checkIn(data) : api.checkIn(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}
export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.checkOut(id) : api.checkOut({ checkInId: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}
export function useQrCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => USE_MOCK ? Promise.reject(new Error("QR check-in not available in mock mode")) : api.qrCheckIn({ code }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}

// === Payments ===
export function usePayments(userId?: string) {
  return useQuery({
    queryKey: Q.payments(userId),
    queryFn: () => USE_MOCK ? mockService.getPayments(userId) : api.getPayments(userId ? { userId } : undefined),
  });
}
export function usePayment(id?: string) {
  return useQuery({
    queryKey: Q.payment(id || ""),
    queryFn: () => USE_MOCK ? mockService.getPayment(id || "") : api.getPayment(id || ""),
    enabled: !!id,
  });
}
export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Payment>) => USE_MOCK ? mockService.createPayment(data) : api.createPayment(data as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

// === Notifications ===
export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: Q.notifications(userId || ""),
    queryFn: () => USE_MOCK ? mockService.getNotifications(userId || "") : api.getNotifications(),
    enabled: !!userId || !USE_MOCK,
  });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.markNotificationRead(id) : api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => USE_MOCK ? mockService.markAllNotificationsRead(userId) : api.markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
