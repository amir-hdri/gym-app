import { sleep } from "./utils";
import type {
  User, Branch, MembershipPlan, Membership, Exercise,
  TrainingProgram, Goal, CheckIn, Payment, Notification,
  DashboardStats, ProgramExercise, CoachDashboardData,
  AthleteDashboardData, ApiResponse, PaginatedResponse,
} from "./types";
import {
  mockUsers, mockAthletes, mockBranches, mockPlans,
  mockExercises, mockMemberships, mockGoals, mockCheckIns,
  mockPayments, mockNotifications, mockDashboardStats,
  createMockPrograms, createMockNotifications, generateId,
} from "./mock-data";

const DELAY = 400;

function wrap<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function wrapList<T>(data: T[]): PaginatedResponse<T> {
  return { success: true, data, meta: { page: 1, pageSize: data.length, total: data.length, totalPages: 1 } };
}

function findOrThrow<T extends { id: string }>(items: T[], id: string, label: string): T {
  const item = items.find((x) => x.id === id);
  if (!item) throw new Error(`${label} with id ${id} not found`);
  return item;
}

export const mockService = {
  // === Dashboard ===
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    await sleep(DELAY);
    return wrap(mockDashboardStats);
  },

  async getAthleteDashboard(athleteId: string): Promise<ApiResponse<AthleteDashboardData>> {
    await sleep(DELAY);
    const programs = createMockPrograms().filter((p) => p.athleteId === athleteId);
    const currentProgram = programs.find((p) => p.status === "active");
    const now = new Date();
    const todayDay = now.getDay(); // 0=Sun in JS but we use 1=Sat in our app
    const todayExercises = currentProgram
      ? currentProgram.exercises.filter((e) => e.dayOfWeek === todayDay)
      : [];
    const athleteGoals = mockGoals.filter((g) => g.athleteId === athleteId);
    const checkIns = mockCheckIns.filter((c) => c.userId === athleteId);
    const membership = mockMemberships.find((m) => m.userId === athleteId);
    const totalSessions = checkIns.length;
    return wrap({
      currentProgram,
      todayExercises,
      upcomingGoals: athleteGoals.filter((g) => g.status !== "achieved" && g.status !== "missed"),
      recentCheckIns: checkIns.slice(-5),
      membership,
      stats: {
        totalSessions,
        completedSessions: checkIns.filter((checkIn) => checkIn.checkOutTime).length,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  },

  async getCoachDashboard(coachId: string): Promise<ApiResponse<CoachDashboardData>> {
    await sleep(DELAY);
    const coachPrograms = createMockPrograms().filter((p) => p.coachId === coachId);
    const athletes = mockAthletes.filter((a) => coachPrograms.some((p) => p.athleteId === a.id)).map((a) => {
      const program = coachPrograms.find((p) => p.athleteId === a.id);
      const exercises = program?.exercises ?? [];
      const completedExercises = exercises.filter((exercise) => exercise.isCompleted).length;
      return {
        id: a.id, name: `${a.firstName} ${a.lastName}`, avatarUrl: a.avatarUrl,
        currentProgram: program, lastCheckIn: mockCheckIns.find((c) => c.userId === a.id)?.checkInTime,
        progress: exercises.length ? Math.round((completedExercises / exercises.length) * 100) : 0,
      };
    });
    return wrap({
      totalAthletes: athletes.length,
      activePrograms: coachPrograms.filter((p) => p.status === "active").length,
      pendingReviews: 3,
      todaySessions: 5,
      athletes,
    });
  },

  // === Users / Members / Coaches ===
  async getUsers(role?: string): Promise<PaginatedResponse<User>> {
    await sleep(DELAY);
    let data = mockUsers;
    if (role) data = data.filter((u) => u.role === role);
    return wrapList(data);
  },

  async getUser(id: string): Promise<ApiResponse<User>> {
    await sleep(DELAY / 2);
    const user = findOrThrow(mockUsers, id, "User");
    return wrap(user);
  },

  async createUser(data: Partial<User>): Promise<ApiResponse<User>> {
    await sleep(DELAY);
    const user: User = {
      id: generateId(), email: data.email || "", firstName: data.firstName || "",
      lastName: data.lastName || "", phone: data.phone || "", role: data.role || "athlete",
      status: "active", branchId: data.branchId, branchName: data.branchName,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    mockUsers.push(user);
    return wrap(user);
  },

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    await sleep(DELAY);
    const user = findOrThrow(mockUsers, id, "User");
    Object.assign(user, data, { updatedAt: new Date().toISOString() });
    return wrap(user);
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    const idx = mockUsers.findIndex((u) => u.id === id);
    if (idx >= 0) mockUsers.splice(idx, 1);
    return wrap(undefined);
  },

  // === Branches ===
  async getBranches(): Promise<PaginatedResponse<Branch>> {
    await sleep(DELAY);
    return wrapList(mockBranches);
  },

  // === Membership Plans ===
  async getMembershipPlans(): Promise<PaginatedResponse<MembershipPlan>> {
    await sleep(DELAY);
    return wrapList(mockPlans);
  },

  async getMembershipPlan(id: string): Promise<ApiResponse<MembershipPlan>> {
    await sleep(DELAY / 2);
    return wrap(findOrThrow(mockPlans, id, "Plan"));
  },

  async createMembershipPlan(data: Partial<MembershipPlan>): Promise<ApiResponse<MembershipPlan>> {
    await sleep(DELAY);
    const plan: MembershipPlan = {
      id: generateId(), name: data.name || "", description: data.description || "",
      durationDays: data.durationDays || 30, sessionsCount: data.sessionsCount || 0,
      price: data.price || 0, discountPercent: data.discountPercent || 0,
      features: data.features || [], isActive: true,
      branchId: data.branchId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    mockPlans.push(plan);
    return wrap(plan);
  },

  async updateMembershipPlan(id: string, data: Partial<MembershipPlan>): Promise<ApiResponse<MembershipPlan>> {
    await sleep(DELAY);
    const plan = findOrThrow(mockPlans, id, "Plan");
    Object.assign(plan, data, { updatedAt: new Date().toISOString() });
    return wrap(plan);
  },

  // === Memberships ===
  async getMemberships(): Promise<PaginatedResponse<Membership>> {
    await sleep(DELAY);
    const items = mockMemberships.map((m) => ({
      ...m,
      user: mockUsers.find((u) => u.id === m.userId),
      plan: mockPlans.find((p) => p.id === m.planId),
    }));
    return { success: true, data: items, meta: { page: 1, pageSize: items.length, total: items.length, totalPages: 1 } };
  },

  async getMembership(id: string): Promise<ApiResponse<Membership>> {
    await sleep(DELAY / 2);
    const m = findOrThrow(mockMemberships, id, "Membership");
    return wrap({ ...m, user: mockUsers.find((u) => u.id === m.userId), plan: mockPlans.find((p) => p.id === m.planId) });
  },

  // === Exercises ===
  async getExercises(): Promise<PaginatedResponse<Exercise>> {
    await sleep(DELAY);
    return wrapList(mockExercises);
  },

  async getExercise(id: string): Promise<ApiResponse<Exercise>> {
    await sleep(DELAY / 2);
    return wrap(findOrThrow(mockExercises, id, "Exercise"));
  },

  async createExercise(data: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    await sleep(DELAY);
    const ex: Exercise = {
      id: generateId(), name: data.name || "", category: data.category || "قدرتی",
      muscleGroup: data.muscleGroup || "", difficulty: data.difficulty || "beginner",
      equipment: data.equipment || "", isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    mockExercises.push(ex);
    return wrap(ex);
  },

  // === Training Programs ===
  async getTrainingPrograms(): Promise<PaginatedResponse<TrainingProgram>> {
    await sleep(DELAY);
    return wrapList(createMockPrograms());
  },

  async getTrainingProgram(id: string): Promise<ApiResponse<TrainingProgram>> {
    await sleep(DELAY / 2);
    const programs = createMockPrograms();
    return wrap(findOrThrow(programs, id, "Program"));
  },

  async createTrainingProgram(data: Partial<TrainingProgram>): Promise<ApiResponse<TrainingProgram>> {
    await sleep(DELAY);
    const prog: TrainingProgram = {
      id: generateId(), athleteId: data.athleteId || "", coachId: data.coachId || "",
      name: data.name || "", description: data.description || "",
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date().toISOString(),
      frequencyPerWeek: data.frequencyPerWeek || 3, status: "draft",
      exercises: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    return wrap(prog);
  },

  async completeProgramExercise(exerciseId: string): Promise<ApiResponse<ProgramExercise>> {
    await sleep(DELAY / 2);
    const programs = createMockPrograms();
    for (const p of programs) {
      const ex = p.exercises.find((e) => e.id === exerciseId);
      if (ex) {
        ex.isCompleted = !ex.isCompleted;
        ex.completedAt = ex.isCompleted ? new Date().toISOString() : undefined;
        return wrap(ex);
      }
    }
    throw new Error("Exercise not found");
  },

  // === Goals ===
  async getGoals(athleteId?: string): Promise<PaginatedResponse<Goal>> {
    await sleep(DELAY);
    let data = mockGoals;
    if (athleteId) data = data.filter((g) => g.athleteId === athleteId);
    return wrapList(data);
  },

  async getGoal(id: string): Promise<ApiResponse<Goal>> {
    await sleep(DELAY / 2);
    return wrap(findOrThrow(mockGoals, id, "Goal"));
  },

  async createGoal(data: Partial<Goal>): Promise<ApiResponse<Goal>> {
    await sleep(DELAY);
    const goal: Goal = {
      id: generateId(), athleteId: data.athleteId || "", title: data.title || "",
      targetValue: data.targetValue || 0, currentValue: 0, unit: data.unit || "",
      category: data.category || "custom", startDate: new Date().toISOString(),
      targetDate: data.targetDate || new Date().toISOString(), status: "not_started",
      progressPercentage: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    mockGoals.push(goal);
    return wrap(goal);
  },

  async updateGoalProgress(id: string, currentValue: number): Promise<ApiResponse<Goal>> {
    await sleep(DELAY / 2);
    const goal = findOrThrow(mockGoals, id, "Goal");
    goal.currentValue = currentValue;
    goal.progressPercentage = Math.min(100, Math.round((currentValue / goal.targetValue) * 100));
    if (goal.progressPercentage >= 100) goal.status = "achieved";
    else goal.status = "in_progress";
    goal.updatedAt = new Date().toISOString();
    return wrap(goal);
  },

  // === Check-ins ===
  async getCheckIns(userId?: string): Promise<PaginatedResponse<CheckIn>> {
    await sleep(DELAY);
    let data = mockCheckIns;
    if (userId) data = data.filter((c) => c.userId === userId);
    return wrapList(data);
  },

  async checkIn(data: { userId: string; branchId: string }): Promise<ApiResponse<CheckIn>> {
    await sleep(DELAY);
    const checkIn: CheckIn = {
      id: generateId(), userId: data.userId, branchId: data.branchId,
      checkInTime: new Date().toISOString(), sessionDeducted: true,
      createdAt: new Date().toISOString(),
    };
    mockCheckIns.push(checkIn);
    return wrap(checkIn);
  },

  async checkOut(id: string): Promise<ApiResponse<CheckIn>> {
    await sleep(DELAY);
    const ci = findOrThrow(mockCheckIns, id, "CheckIn");
    ci.checkOutTime = new Date().toISOString();
    const diff = new Date(ci.checkOutTime).getTime() - new Date(ci.checkInTime).getTime();
    ci.durationMinutes = Math.round(diff / 60000);
    return wrap(ci);
  },

  // === Payments ===
  async getPayments(userId?: string): Promise<PaginatedResponse<Payment>> {
    await sleep(DELAY);
    let data = mockPayments;
    if (userId) data = data.filter((p) => p.userId === userId);
    return wrapList(data.map((p) => ({
      ...p, user: mockUsers.find((u) => u.id === p.userId),
    })));
  },

  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    await sleep(DELAY / 2);
    const p = findOrThrow(mockPayments, id, "Payment");
    return wrap({ ...p, user: mockUsers.find((u) => u.id === p.userId) });
  },

  async createPayment(data: Partial<Payment>): Promise<ApiResponse<Payment>> {
    await sleep(DELAY);
    const payment: Payment = {
      id: generateId(), userId: data.userId || "", amount: data.amount || 0,
      currency: "تومان", status: "completed", method: data.method || "card",
      paidAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPayments.push(payment);
    return wrap(payment);
  },

  // === Notifications ===
  async getNotifications(userId: string): Promise<PaginatedResponse<Notification>> {
    await sleep(DELAY / 2);
    return wrapList(mockNotifications[userId] || createMockNotifications(userId));
  },

  async markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
    await sleep(DELAY / 3);
    for (const key of Object.keys(mockNotifications)) {
      const n = mockNotifications[key].find((x) => x.id === id);
      if (n) { n.isRead = true; return wrap(n); }
    }
    throw new Error("Notification not found");
  },

  async markAllNotificationsRead(userId: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    const notes = mockNotifications[userId];
    if (notes) notes.forEach((n) => { n.isRead = true; });
    return wrap(undefined);
  },
};
