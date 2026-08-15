import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockService } from "@/lib/mock-service";
import type {
  User, MembershipPlan, Membership, Exercise, TrainingProgram,
  Goal, CheckIn, Payment, Notification, DashboardStats,
  AthleteDashboardData, CoachDashboardData, Branch,
} from "@/lib/types";

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
  return useQuery({ queryKey: Q.dashboardStats, queryFn: () => mockService.getDashboardStats() });
}

export function useAthleteDashboard(athleteId?: string) {
  return useQuery({
    queryKey: Q.athleteDashboard(athleteId || ""),
    queryFn: () => mockService.getAthleteDashboard(athleteId || ""),
    enabled: !!athleteId,
  });
}

export function useCoachDashboard(coachId?: string) {
  return useQuery({
    queryKey: Q.coachDashboard(coachId || ""),
    queryFn: () => mockService.getCoachDashboard(coachId || ""),
    enabled: !!coachId,
  });
}

// === Users ===
export function useUsers(role?: string) {
  return useQuery({ queryKey: Q.users(role), queryFn: () => mockService.getUsers(role) });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: Q.user(id || ""),
    queryFn: () => mockService.getUser(id || ""),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => mockService.createUser(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}

// === Branches ===
export function useBranches() {
  return useQuery({ queryKey: Q.branches, queryFn: () => mockService.getBranches() });
}

// === Plans ===
export function useMembershipPlans() {
  return useQuery({ queryKey: Q.plans, queryFn: () => mockService.getMembershipPlans() });
}

export function useMembershipPlan(id?: string) {
  return useQuery({
    queryKey: Q.plan(id || ""),
    queryFn: () => mockService.getMembershipPlan(id || ""),
    enabled: !!id,
  });
}

export function useCreateMembershipPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MembershipPlan>) => mockService.createMembershipPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

// === Memberships ===
export function useMemberships() {
  return useQuery({ queryKey: Q.memberships, queryFn: () => mockService.getMemberships() });
}

export function useMembership(id?: string) {
  return useQuery({
    queryKey: Q.membership(id || ""),
    queryFn: () => mockService.getMembership(id || ""),
    enabled: !!id,
  });
}

// === Exercises ===
export function useExercises() {
  return useQuery({ queryKey: Q.exercises, queryFn: () => mockService.getExercises() });
}

export function useExercise(id?: string) {
  return useQuery({
    queryKey: Q.exercise(id || ""),
    queryFn: () => mockService.getExercise(id || ""),
    enabled: !!id,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Exercise>) => mockService.createExercise(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

// === Training Programs ===
export function useTrainingPrograms() {
  return useQuery({ queryKey: Q.programs, queryFn: () => mockService.getTrainingPrograms() });
}

export function useTrainingProgram(id?: string) {
  return useQuery({
    queryKey: Q.program(id || ""),
    queryFn: () => mockService.getTrainingProgram(id || ""),
    enabled: !!id,
  });
}

export function useCreateTrainingProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingProgram>) => mockService.createTrainingProgram(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });
}

export function useCompleteProgramExercise() {
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
    queryFn: () => mockService.getGoals(athleteId),
  });
}

export function useGoal(id?: string) {
  return useQuery({
    queryKey: Q.goal(id || ""),
    queryFn: () => mockService.getGoal(id || ""),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Goal>) => mockService.createGoal(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) =>
      mockService.updateGoalProgress(id, currentValue),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

// === Check-ins ===
export function useCheckIns(userId?: string) {
  return useQuery({
    queryKey: Q.checkIns(userId),
    queryFn: () => mockService.getCheckIns(userId),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; branchId: string }) => mockService.checkIn(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockService.checkOut(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}

// === Payments ===
export function usePayments(userId?: string) {
  return useQuery({
    queryKey: Q.payments(userId),
    queryFn: () => mockService.getPayments(userId),
  });
}

export function usePayment(id?: string) {
  return useQuery({
    queryKey: Q.payment(id || ""),
    queryFn: () => mockService.getPayment(id || ""),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Payment>) => mockService.createPayment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

// === Notifications ===
export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: Q.notifications(userId || ""),
    queryFn: () => mockService.getNotifications(userId || ""),
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockService.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => mockService.markAllNotificationsRead(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
