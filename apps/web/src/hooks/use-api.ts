/**
 * React Query hooks over the data layer.
 *
 * Data comes from one of two places — the real API (`@/lib/api`, a lazy facade
 * so `axios` stays out of the public-route bundle) or the mock service (loaded
 * through a lazy proxy so its fixtures never ship to production). Both, plus
 * the query-key map `Q` and the optimistic-update helpers, live in
 * `./api-source`; neither may be imported statically here.
 *
 * Messaging and analytics hooks live in `./use-messages` and `./use-analytics`
 * and are re-exported at the bottom, so `@/hooks/use-api` remains the single
 * import site for UI code.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  User, UserRole, UserStatus, Branch, MembershipPlan, MembershipInput, Exercise, TrainingProgram, ProgramExercise,
  ProgramExerciseInput, Goal, Payment, Notification, AthleteDashboardData,
} from "@/lib/types";
import {
  Q, USE_MOCK, mockService, requireUserId,
  snapshotQueries, restoreQueries, patchListQueries, patchItemQueries,
} from "./api-source";

export { Q, USE_MOCK, currentUserId } from "./api-source";

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
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      USE_MOCK ? mockService.updateUser(id, data) : api.updateUser(id, data as Record<string, unknown>),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: Q.user(id) });
    },
  });
}
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.deleteUser(id) : api.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}

/**
 * Activates, deactivates or suspends an account.
 *
 * Separate from `useUpdateUser` because the server validates the value here:
 * `PATCH /users/{id}/status` answers 400 for anything outside `UserStatus`,
 * where `PUT /users/{id}` would write it through.
 *
 * Optimistic — a toggle in a long member list has to respond on tap, and a
 * single enum field is cheap to roll back.
 */
export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      USE_MOCK ? mockService.updateUserStatus(id, status) : api.updateUserStatus(id, status),

    onMutate: async ({ id, status }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["users"] }),
        qc.cancelQueries({ queryKey: Q.user(id) }),
      ]);
      const snapshot = [...snapshotQueries(qc, ["users"]), ...snapshotQueries(qc, Q.user(id))];

      patchListQueries<User>(qc, ["users"], (users) =>
        users.map((u) => (u.id === id ? { ...u, status } : u)));
      patchItemQueries<User>(qc, Q.user(id), (u) => ({ ...u, status }));

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: (_res, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: Q.user(id) });
      // An activation changes the active-member count on the admin dashboard.
      qc.invalidateQueries({ queryKey: Q.dashboardStats });
    },
  });
}

/**
 * Changes a user's role (admin-only). The single legal path — the generic
 * update strips `role` server-side, so this must be its own mutation with
 * its own invalidation. Not optimistic: a rejected promotion must never
 * flash the new role in a member list.
 */
export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      USE_MOCK ? mockService.updateUserRole(requireUserId(), id, role) : api.updateUserRole(id, role),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: Q.user(id) });
    },
  });
}

/**
 * Sets a user's password.
 *
 * Pass `currentPassword` when the signed-in user is changing their own; omit it
 * when an admin is resetting someone else's. Prefer `useChangePassword` for the
 * plain self-service case — it hits `/auth/change-password` and needs no id.
 */
export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; currentPassword?: string; newPassword: string }) =>
      USE_MOCK
        ? mockService.setUserPassword(requireUserId(), id, data)
        : api.setUserPassword(id, data),
  });
}

// === Profile & password (API contract v2 §2, §3) ===
/** Reads the signed-in user's own profile — the revalidation source. */
export function useProfile() {
  return useQuery({
    queryKey: Q.profile,
    queryFn: () => USE_MOCK ? mockService.getProfile(requireUserId()) : api.getProfile(),
  });
}

/** Updates the signed-in user's own profile. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) =>
      USE_MOCK ? mockService.updateProfile(requireUserId(), data) : api.updateProfile(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      if (res.data) qc.invalidateQueries({ queryKey: Q.user(res.data.id) });
      qc.invalidateQueries({ queryKey: Q.profile });
    },
  });
}

/**
 * Requests a password-reset link. Always resolves successfully, whether or not
 * the address is registered — the response must not reveal which.
 * Outside production the payload carries `devToken`, since the project has no
 * mail transport (see `## Deviations` in docs/API_CONTRACT_V2.md).
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      USE_MOCK ? mockService.forgotPassword(data.email) : api.forgotPassword(data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      USE_MOCK ? mockService.resetPassword(data.token, data.password) : api.resetPassword(data),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      USE_MOCK
        ? mockService.changePassword(requireUserId(), data.currentPassword, data.newPassword)
        : api.changePassword(data),
  });
}

// === Branches ===
export function useBranches() {
  return useQuery({ queryKey: Q.branches, queryFn: () => USE_MOCK ? mockService.getBranches() : api.getBranches() });
}
/** Single branch — for settings rows and the onboarding branch picker. */
export function useBranch(id?: string) {
  return useQuery({
    queryKey: ["branch", id || ""],
    queryFn: async () => {
      if (USE_MOCK) {
        const list = await mockService.getBranches();
        const found = list.data?.find((b) => b.id === id);
        if (!found) throw new Error("Branch not found");
        return { success: true, data: found } as const;
      }
      return api.getBranch(id || "");
    },
    enabled: !!id,
  });
}
export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Branch>) => USE_MOCK ? mockService.createBranch(data) : api.createBranch(data as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); },
  });
}
export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Branch> }) =>
      USE_MOCK ? mockService.updateBranch(id, data) : api.updateBranch(id, data as Record<string, unknown>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); },
  });
}
/** Rejected with 409 by the API when the branch still has members or memberships. */
export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.deleteBranch(id) : api.deleteBranch(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); },
  });
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
export function useUpdateMembershipPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MembershipPlan> }) =>
      USE_MOCK ? mockService.updateMembershipPlan(id, data) : api.updateMembershipPlan(id, data as Record<string, unknown>),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: Q.plan(id) });
    },
  });
}
/**
 * Deletes a plan, or — when memberships still reference it — deactivates it.
 * Either way the response carries the plan, so `data.isActive` tells the UI
 * which of the two happened.
 */
export function useDeleteMembershipPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.deleteMembershipPlan(id) : api.deleteMembershipPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["memberships"] });
    },
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
/** Burns one session off a session-based membership. */
export function useDeductSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.deductSession(id) : api.deductSession(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ["memberships"] });
      qc.invalidateQueries({ queryKey: Q.membership(id) });
    },
  });
}

/** Everything a membership write has to refresh: the list, the row, and the
 *  revenue/active-member tiles that count memberships. */
function invalidateMembership(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: ["memberships"] });
  if (id) qc.invalidateQueries({ queryKey: Q.membership(id) });
  qc.invalidateQueries({ queryKey: Q.dashboardStats });
  qc.invalidateQueries({ queryKey: ["analytics", "membership-distribution"] });
}

/** Assigns a plan to a member. Staff only — the server answers 403 otherwise. */
export function useCreateMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MembershipInput) =>
      USE_MOCK ? mockService.createMembership(data) : api.createMembership(data),
    onSuccess: (res) => invalidateMembership(qc, res.data?.id),
  });
}

export function useUpdateMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MembershipInput> & { id: string }) =>
      USE_MOCK ? mockService.updateMembership(id, data) : api.updateMembership(id, data),
    onSuccess: (_res, { id }) => invalidateMembership(qc, id),
  });
}

/**
 * Freeze and unfreeze are deliberately **not** optimistic. Both are rejected
 * outright unless the membership is in the one state they accept (`active` for
 * freeze, `frozen` for unfreeze), so a predicted flip would show the new state
 * for as long as the round trip takes and then snap back on a 400 — worse than
 * waiting.
 */
export function useFreezeMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; reason?: string; endDate?: string }) =>
      USE_MOCK ? mockService.freezeMembership(id, data) : api.freezeMembership(id, data),
    onSuccess: (_res, { id }) => invalidateMembership(qc, id),
  });
}

export function useUnfreezeMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      USE_MOCK ? mockService.unfreezeMembership(id) : api.unfreezeMembership(id),
    onSuccess: (_res, id) => invalidateMembership(qc, id),
  });
}

/**
 * Starts a new term on a membership. Not optimistic — a rejected renewal
 * (end date before term start) must never flash new dates in the UI.
 */
export function useRenewMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; endDate: string; sessionsTotal?: number; resetSessionsUsed?: boolean }) =>
      USE_MOCK ? mockService.renewMembership(id, data) : api.renewMembership(id, data),
    onSuccess: (_res, { id }) => invalidateMembership(qc, id),
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
export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      USE_MOCK ? mockService.updateExercise(id, data) : api.updateExercise(id, data as Record<string, unknown>),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
      qc.invalidateQueries({ queryKey: Q.exercise(id) });
    },
  });
}
/** Rejected with 409 by the API when a training program still uses the exercise. */
export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.deleteExercise(id) : api.deleteExercise(id),
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
export function useUpdateTrainingProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TrainingProgram> }) =>
      USE_MOCK ? mockService.updateTrainingProgram(id, data) : api.updateTrainingProgram(id, data as Record<string, unknown>),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      qc.invalidateQueries({ queryKey: Q.program(id) });
      qc.invalidateQueries({ queryKey: ["athlete", "dashboard"] });
    },
  });
}
export function useDeleteTrainingProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.deleteTrainingProgram(id) : api.deleteTrainingProgram(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ["programs"] });
      qc.removeQueries({ queryKey: Q.program(id) });
      qc.invalidateQueries({ queryKey: ["athlete", "dashboard"] });
    },
  });
}

// --- Program builder ---------------------------------------------------------
// The coach's three writes against a program's exercise list. All of them
// invalidate rather than patch: the server assigns `id`, resolves the joined
// `exercise` row and settles `order`, and a builder screen can afford the
// round-trip in a way the athlete's completion checkbox cannot.

/** Invalidates every cache shape that embeds a program's exercise list. */
function invalidateProgram(qc: ReturnType<typeof useQueryClient>, programId: string) {
  qc.invalidateQueries({ queryKey: ["programs"] });
  qc.invalidateQueries({ queryKey: Q.program(programId) });
  qc.invalidateQueries({ queryKey: ["athlete", "dashboard"] });
  qc.invalidateQueries({ queryKey: ["coach", "dashboard"] });
}

export function useAddProgramExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, data }: {
      programId: string;
      data: ProgramExerciseInput & { exerciseId: string; dayOfWeek: number };
    }) => USE_MOCK
      ? mockService.addProgramExercise(programId, data)
      : api.addProgramExercise(programId, data),
    onSuccess: (_res, { programId }) => invalidateProgram(qc, programId),
  });
}

/** Partial: fields left out of `data` keep their stored value. */
export function useUpdateProgramExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, exerciseId, data }: {
      programId: string; exerciseId: string; data: ProgramExerciseInput;
    }) => USE_MOCK
      ? mockService.updateProgramExercise(programId, exerciseId, data)
      : api.updateProgramExercise(programId, exerciseId, data),
    onSuccess: (_res, { programId }) => invalidateProgram(qc, programId),
  });
}

export function useDeleteProgramExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, exerciseId }: { programId: string; exerciseId: string }) =>
      USE_MOCK
        ? mockService.deleteProgramExercise(programId, exerciseId)
        : api.deleteProgramExercise(programId, exerciseId),
    onSuccess: (_res, { programId }) => invalidateProgram(qc, programId),
  });
}

/** Flips one exercise's completion flag wherever it is cached. */
function markExercise(list: ProgramExercise[], exerciseId: string, completed: boolean): ProgramExercise[] {
  return list.map((e) => e.id === exerciseId
    ? { ...e, isCompleted: completed, completedAt: completed ? new Date().toISOString() : undefined }
    : e);
}

/**
 * Ticks a program exercise off. The checkbox flips at once: this is the single
 * most-tapped control in the athlete app, and a round-trip's delay there reads
 * as a dropped tap.
 *
 * Three cache shapes hold the same exercise — the program list, a single
 * program, and the athlete dashboard (both its `todayExercises` and its
 * `currentProgram`) — so all three are patched, snapshotted and rolled back
 * together.
 */
export function useCompleteProgramExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, exerciseId, completed = true, data }: {
      programId: string; exerciseId: string; completed?: boolean; data?: Record<string, unknown>;
    }) =>
      USE_MOCK
        ? mockService.completeProgramExercise(programId, exerciseId, completed, data)
        : api.completeProgramExercise(programId, exerciseId, { completed, ...(data ?? {}) }),

    onMutate: async ({ programId, exerciseId, completed = true }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["programs"] }),
        qc.cancelQueries({ queryKey: Q.program(programId) }),
        qc.cancelQueries({ queryKey: ["athlete", "dashboard"] }),
      ]);
      const snapshot = [
        ...snapshotQueries(qc, ["programs"]),
        ...snapshotQueries(qc, Q.program(programId)),
        ...snapshotQueries(qc, ["athlete", "dashboard"]),
      ];

      patchListQueries<TrainingProgram>(qc, ["programs"], (programs) =>
        programs.map((p) => p.exercises.some((e) => e.id === exerciseId)
          ? { ...p, exercises: markExercise(p.exercises, exerciseId, completed) }
          : p));
      patchItemQueries<TrainingProgram>(qc, Q.program(programId), (p) => ({
        ...p, exercises: markExercise(p.exercises, exerciseId, completed),
      }));
      patchItemQueries<AthleteDashboardData>(qc, ["athlete", "dashboard"], (d) => ({
        ...d,
        todayExercises: markExercise(d.todayExercises, exerciseId, completed),
        currentProgram: d.currentProgram
          ? { ...d.currentProgram, exercises: markExercise(d.currentProgram.exercises, exerciseId, completed) }
          : d.currentProgram,
      }));

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: (_res, _err, { programId }) => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["programs"] }),
        qc.invalidateQueries({ queryKey: Q.program(programId) }),
        qc.invalidateQueries({ queryKey: ["athlete", "dashboard"] }),
      ]);
    },
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

/** The same derivation the server applies, so the optimistic value matches it. */
function applyGoalProgress(goal: Goal, currentValue: number): Goal {
  const progressPercentage = goal.targetValue > 0
    ? Math.min(100, Math.round((currentValue / goal.targetValue) * 100))
    : goal.progressPercentage;
  return {
    ...goal,
    currentValue,
    progressPercentage,
    status: progressPercentage >= 100 ? "achieved" : "in_progress",
  };
}

/**
 * Records progress against a goal. The number and its progress bar move with
 * the slider rather than after it, which is the whole point of the control.
 */
export function useUpdateGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) =>
      USE_MOCK ? mockService.updateGoalProgress(id, currentValue) : api.updateGoalProgress(id, currentValue),

    onMutate: async ({ id, currentValue }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["goals"] }),
        qc.cancelQueries({ queryKey: Q.goal(id) }),
      ]);
      const snapshot = [...snapshotQueries(qc, ["goals"]), ...snapshotQueries(qc, Q.goal(id))];

      patchListQueries<Goal>(qc, ["goals"], (goals) =>
        goals.map((g) => (g.id === id ? applyGoalProgress(g, currentValue) : g)));
      patchItemQueries<Goal>(qc, Q.goal(id), (g) => applyGoalProgress(g, currentValue));

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: (_res, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: Q.goal(id) });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Goal> }) =>
      USE_MOCK ? mockService.updateGoal(id, data) : api.updateGoal(id, data as Record<string, unknown>),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: Q.goal(id) });
    },
  });
}
export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.deleteGoal(id) : api.deleteGoal(id),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkins"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["athlete", "dashboard"] });
    },
  });
}
export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.checkOut(id) : api.checkOut({ checkInId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkins"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["athlete", "dashboard"] });
    },
  });
}

/**
 * Closes a session at a time the staff member picks, for the member who left
 * without checking out. Not optimistic: the server rejects an already-closed
 * session with a 400, and `durationMinutes` is computed server-side from the
 * stored check-in time, so there is nothing reliable to predict.
 *
 * `checkOutTime` is an ISO-8601 string.
 */
export function useCheckOutAt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checkOutTime }: { id: string; checkOutTime: string }) =>
      USE_MOCK ? mockService.checkOutAt(id, checkOutTime) : api.checkOutAt(id, checkOutTime),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkins"] });
      // Attendance duration feeds the dashboard tiles and the activity chart.
      qc.invalidateQueries({ queryKey: Q.dashboardStats });
      qc.invalidateQueries({ queryKey: ["analytics", "athlete-activity"] });
    },
  });
}
export function useQrCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => USE_MOCK ? mockService.qrCheckIn({ code }) : api.qrCheckIn({ code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkins"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["athlete", "dashboard"] });
    },
  });
}

/** Voids an erroneous check-in record. Staff-only; invalidates the lists. */
export function useVoidCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.voidCheckIn(id) : api.voidCheckIn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checkins"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
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
/** Reconciles a payment — typically marking it completed or refunded. */
export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: { status?: "pending" | "completed" | "failed" | "refunded"; method?: Payment["method"]; notes?: string };
    }) => USE_MOCK ? mockService.updatePayment(id, data) : api.updatePayment(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: Q.payment(id) });
      qc.invalidateQueries({ queryKey: Q.dashboardStats });
    },
  });
}

/**
 * Transitions a payment's status and nothing else — the one-click reconcile in
 * the admin payments table.
 *
 * Preferred over `useUpdatePayment` for that: it accepts `cancelled` (which
 * `PUT /payments/{id}` refuses with a 422) and cannot blank a field the caller
 * never meant to send.
 */
export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Payment["status"] }) =>
      USE_MOCK ? mockService.updatePaymentStatus(id, status) : api.updatePaymentStatus(id, status),

    onMutate: async ({ id, status }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["payments"] }),
        qc.cancelQueries({ queryKey: Q.payment(id) }),
      ]);
      const snapshot = [...snapshotQueries(qc, ["payments"]), ...snapshotQueries(qc, Q.payment(id))];

      patchListQueries<Payment>(qc, ["payments"], (payments) =>
        payments.map((p) => (p.id === id ? { ...p, status } : p)));
      patchItemQueries<Payment>(qc, Q.payment(id), (p) => ({ ...p, status }));

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: (_res, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: Q.payment(id) });
      // Revenue totals and the revenue trend both move when a payment settles.
      qc.invalidateQueries({ queryKey: Q.dashboardStats });
      qc.invalidateQueries({ queryKey: ["analytics", "revenue-trend"] });
    },
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

/** Marks one notification read; the dot clears on tap, not on response. */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.markNotificationRead(id) : api.markNotificationRead(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const snapshot = snapshotQueries(qc, ["notifications"]);
      patchListQueries<Notification>(qc, ["notifications"], (items) =>
        items.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      return { snapshot };
    },
    onError: (_err, _id, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

/** Clears the whole list at once — the "mark all read" button. */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => USE_MOCK ? mockService.markAllNotificationsRead(userId) : api.markAllNotificationsRead(),

    onMutate: async (userId) => {
      const key = Q.notifications(userId);
      await qc.cancelQueries({ queryKey: key });
      const snapshot = snapshotQueries(qc, key);
      patchListQueries<Notification>(qc, key, (items) =>
        items.map((n) => (n.isRead ? n : { ...n, isRead: true })));
      return { snapshot };
    },
    onError: (_err, _userId, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

/**
 * Removes a notification from the caller's own list. Optimistic: dismissing a
 * toast-like row should feel instant, and the row reappears on failure because
 * the snapshot is restored.
 *
 * Keyed on `["notifications"]` rather than `Q.notifications(userId)` for the
 * same reason as `useMarkNotificationRead` — the id alone does not say whose
 * list it belongs to, and the server scopes the delete to the caller anyway.
 */
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => USE_MOCK ? mockService.deleteNotification(id) : api.deleteNotification(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const snapshot = snapshotQueries(qc, ["notifications"]);
      patchListQueries<Notification>(qc, ["notifications"], (items) => items.filter((n) => n.id !== id));
      return { snapshot };
    },
    onError: (_err, _id, ctx) => { restoreQueries(qc, ctx?.snapshot); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

/** Sends a notification to one user (staff only). */
export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; title: string; message: string; type?: Notification["type"] }) =>
      USE_MOCK ? mockService.createNotification(data) : api.createNotification(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

/**
 * Sends a notification to everyone matching the filter (staff only); the
 * response reports how many recipients it reached.
 */
export function useBroadcastNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; message: string; type?: Notification["type"]; role?: User["role"]; branchId?: string }) =>
      USE_MOCK ? mockService.broadcastNotification(data) : api.broadcastNotification(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

// === Messaging & analytics ===
// Defined separately to keep this file navigable; re-exported so existing
// `@/hooks/use-api` imports keep working and new code has one place to look.
export {
  useConversations, useConversation, useCreateConversation,
  useMessages, useSendMessage, useMarkConversationRead, useUnreadMessageCount,
} from "./use-messages";
export {
  useAttendanceTrend, useRevenueTrend, useRevenueSeries, useMembershipDistribution,
  usePeakHours, useAthleteActivity,
} from "./use-analytics";
