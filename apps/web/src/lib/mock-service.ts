import { sleep } from "./utils";
import type {
  User, Branch, MembershipPlan, Membership, Exercise,
  TrainingProgram, Goal, CheckIn, Payment, Notification,
  DashboardStats, ProgramExercise, CoachDashboardData,
  AthleteDashboardData, ApiResponse, PaginatedResponse, AuthTokens,
  UserRole, UserStatus, ProgramExerciseInput, MembershipInput, Conversation, ChatMessage,
  AttendanceTrendPoint, RevenueTrendPoint, RevenueSeries, MembershipDistributionSlice,
  PeakHourPoint, AthleteActivityPoint,
} from "./types";
import {
  mockUsers, mockAthletes, mockBranches, mockPlans,
  mockExercises, mockMemberships, mockGoals, mockCheckIns,
  mockPayments, mockNotifications, mockDashboardStats,
  createMockNotifications, generateId,
  getMockPrograms, mockConversationRows, mockChatMessages,
  mockPasswords, mockResetTokens, DEFAULT_MOCK_PASSWORD,
  createAttendanceTrend, createRevenueTrend, createRevenueSeries, createPeakHours,
  createAthleteActivity,
  type MockConversationRow,
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

function nowIso(): string {
  return new Date().toISOString();
}

/** Shared policy: min 8 characters, at least one letter and one digit. */
const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/** The server's allow-list for `PATCH /users/{id}/status`. */
const USER_STATUSES: readonly UserStatus[] = ["active", "inactive", "suspended", "pending"];

function assertPasswordPolicy(password: string): void {
  if (!PASSWORD_POLICY.test(password)) {
    throw new Error("رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و رقم باشد");
  }
}

function passwordOf(userId: string): string {
  return mockPasswords[userId] ?? DEFAULT_MOCK_PASSWORD;
}

/** Opaque demo token pair; only the expiries are meaningful to the client. */
function mockTokens(userId: string): AuthTokens {
  const stamp = Date.now();
  return {
    accessToken: `mock-access-${userId}-${stamp}`,
    refreshToken: `mock-refresh-${userId}-${stamp}`,
    accessTokenExpiry: new Date(stamp + 30 * 60_000).toISOString(),
    refreshTokenExpiry: new Date(stamp + 7 * 24 * 3_600_000).toISOString(),
  };
}

/**
 * Consecutive-day streaks from check-in days (today counts whether or not
 * today is logged yet — a streak is "alive" if yesterday is present).
 * Mirrors the server's `_compute_streaks`, which the old hardcoded 0/0 did not.
 */
function computeStreaks(checkIns: { checkInTime: string }[]): { currentStreak: number; longestStreak: number } {
  const days = new Set(checkIns.map((c) => c.checkInTime.slice(0, 10)));
  if (days.size === 0) return { currentStreak: 0, longestStreak: 0 };
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  const plusOne = (day: string) => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  for (let i = 1; i < sorted.length; i++) {
    run = plusOne(sorted[i - 1]) === sorted[i] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  let current = 0;
  if (days.has(todayStr) || days.has(yesterdayStr)) {
    let cursor = days.has(todayStr) ? todayStr : yesterdayStr;
    while (days.has(cursor)) {
      current++;
      const d = new Date(`${cursor}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      cursor = d.toISOString().slice(0, 10);
    }
  }
  return { currentStreak: current, longestStreak: longest };
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

/** Rows the caller may see: their own, or everything for an `admin`. */
function visibleConversationRows(viewerId: string): MockConversationRow[] {
  const viewer = mockUsers.find((u) => u.id === viewerId);
  if (viewer?.role === "admin") return mockConversationRows;
  return mockConversationRows.filter((row) => row.athleteId === viewerId || row.coachId === viewerId);
}

function messagesOf(conversationId: string): ChatMessage[] {
  return mockChatMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Projects a raw row into the caller's view of it: `participant` is the *other*
 * party, and for an `admin` caller it is the athlete.
 */
function conversationFor(row: MockConversationRow, viewerId: string): Conversation {
  const thread = messagesOf(row.id);
  const last = thread.at(-1);
  const viewer = mockUsers.find((u) => u.id === viewerId);
  const participantId = viewer?.role === "admin" || row.athleteId !== viewerId ? row.athleteId : row.coachId;
  const participant = mockUsers.find((u) => u.id === participantId);

  return {
    id: row.id,
    athleteId: row.athleteId,
    coachId: row.coachId,
    participant: participant && {
      id: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      role: participant.role,
      avatarUrl: participant.avatarUrl || null,
    },
    lastMessage: last
      ? { id: last.id, body: last.body, senderId: last.senderId, createdAt: last.createdAt }
      : null,
    unreadCount: thread.filter((m) => m.senderId !== viewerId && !m.readAt).length,
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const mockService = {
  // === Auth ===
  // The offline-demo identity provider. Mirrors the server's contracts:
  // unknown address or wrong password → error (never which), non-active
  // accounts refused, self-registration always an athlete, refresh mints a
  // new pair. Tokens are opaque demo strings; only their expiries matter.
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    await sleep(DELAY);
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || passwordOf(user.id) !== password) {
      throw new Error("ایمیل یا رمز عبور درست نیست");
    }
    if (user.status !== "active") {
      throw new Error("حساب کاربری شما فعال نیست");
    }
    user.lastLoginAt = nowIso();
    return wrap({ user, tokens: mockTokens(user.id) });
  },

  async register(data: {
    email: string; password: string; firstName: string; lastName: string; phone?: string; branchId?: string;
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    await sleep(DELAY);
    if (mockUsers.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error("این ایمیل قبلاً ثبت شده است");
    }
    assertPasswordPolicy(data.password);
    const branch = data.branchId ? mockBranches.find((b) => b.id === data.branchId) : undefined;
    const user: User = {
      id: generateId(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? "",
      role: "athlete",
      status: "active",
      avatarUrl: "",
      branchId: branch?.id,
      branchName: branch?.name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastLoginAt: nowIso(),
    };
    mockUsers.push(user);
    mockPasswords[user.id] = data.password;
    mockNotifications[user.id] = createMockNotifications(user.id);
    return wrap({ user, tokens: mockTokens(user.id) });
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    await sleep(DELAY / 2);
    const m = /^mock-refresh-([^-\s]+)-/.exec(refreshToken);
    const user = m ? mockUsers.find((u) => u.id === m[1]) : undefined;
    if (!user || user.status !== "active") {
      throw new Error("نشست منقضی شده است؛ دوباره وارد شوید");
    }
    return wrap(mockTokens(user.id));
  },

  async logout(): Promise<ApiResponse<void>> {
    await sleep(DELAY / 3);
    return wrap(undefined);
  },

  async getProfile(userId: string): Promise<ApiResponse<User>> {
    await sleep(DELAY / 2);
    return wrap(findOrThrow(mockUsers, userId, "User"));
  },

  // === Dashboard ===
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    await sleep(DELAY);
    return wrap(mockDashboardStats);
  },

  async getAthleteDashboard(athleteId: string): Promise<ApiResponse<AthleteDashboardData>> {
    await sleep(DELAY);
    const programs = getMockPrograms().filter((p) => p.athleteId === athleteId);
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
    const { currentStreak, longestStreak } = computeStreaks(checkIns);
    return wrap({
      currentProgram,
      todayExercises,
      upcomingGoals: athleteGoals.filter((g) => g.status !== "achieved" && g.status !== "missed"),
      recentCheckIns: checkIns.slice(-5),
      membership,
      stats: {
        totalSessions,
        completedSessions: checkIns.filter((checkIn) => checkIn.checkOutTime).length,
        currentStreak,
        longestStreak,
      },
    });
  },

  async getCoachDashboard(coachId: string): Promise<ApiResponse<CoachDashboardData>> {
    await sleep(DELAY);
    const coachPrograms = getMockPrograms().filter((p) => p.coachId === coachId);
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
    const todayStr = new Date().toISOString().slice(0, 10);
    const athleteIds = new Set(athletes.map((a) => a.id));
    // Threads where the athlete wrote something the coach has not read yet.
    const pendingReviews = mockConversationRows.filter(
      (row) =>
        row.coachId === coachId &&
        mockChatMessages.some((m) => m.conversationId === row.id && m.senderId !== coachId && !m.readAt),
    ).length;
    const todaySessions = mockCheckIns.filter(
      (c) => athleteIds.has(c.userId) && c.checkInTime.slice(0, 10) === todayStr,
    ).length;
    return wrap({
      totalAthletes: athletes.length,
      activePrograms: coachPrograms.filter((p) => p.status === "active").length,
      pendingReviews,
      todaySessions,
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

  /** Mirrors `PATCH /users/{id}/status`, including its rejection of unknown values. */
  async updateUserStatus(id: string, status: UserStatus): Promise<ApiResponse<User>> {
    await sleep(DELAY / 2);
    if (!USER_STATUSES.includes(status)) {
      throw new Error(`وضعیت نامعتبر است. مقادیر مجاز: ${USER_STATUSES.join("، ")}`);
    }
    const user = findOrThrow(mockUsers, id, "User");
    user.status = status;
    user.updatedAt = nowIso();
    return wrap(user);
  },

  /**
   * Mirrors `PATCH /users/{id}/role`. `callerId` stands in for the bearer
   * token: admin-only, unknown roles rejected, and self-demotion refused.
   */
  async updateUserRole(callerId: string, id: string, role: UserRole): Promise<ApiResponse<User>> {
    await sleep(DELAY / 2);
    const caller = findOrThrow(mockUsers, callerId, "User");
    if (caller.role !== "admin") throw new Error("دسترسی کافی ندارید");
    const USER_ROLES: readonly UserRole[] = ["athlete", "coach", "admin", "receptionist"];
    if (!USER_ROLES.includes(role)) throw new Error("نقش نامعتبر است");
    if (callerId === id) throw new Error("نمی‌توانید نقش خودتان را تغییر دهید");
    const user = findOrThrow(mockUsers, id, "User");
    user.role = role;
    user.updatedAt = nowIso();
    return wrap(user);
  },

  /**
   * Mirrors `POST /users/{id}/password`. `callerId` stands in for the bearer
   * token the real API reads: changing your own password needs the current one,
   * an admin changing someone else's does not, and anyone else is refused.
   */
  async setUserPassword(
    callerId: string,
    targetId: string,
    data: { currentPassword?: string; newPassword: string },
  ): Promise<ApiResponse<{ changed: boolean }>> {
    await sleep(DELAY);
    const caller = findOrThrow(mockUsers, callerId, "User");
    findOrThrow(mockUsers, targetId, "User");
    if (callerId !== targetId && caller.role !== "admin") {
      throw new Error("دسترسی کافی ندارید");
    }
    if (callerId === targetId && data.currentPassword !== passwordOf(targetId)) {
      throw new Error("رمز عبور فعلی اشتباه است");
    }
    assertPasswordPolicy(data.newPassword);

    mockPasswords[targetId] = data.newPassword;
    return wrap({ changed: true });
  },

  // === Branches ===
  async getBranches(): Promise<PaginatedResponse<Branch>> {
    await sleep(DELAY);
    return wrapList(mockBranches);
  },

  async createBranch(data: Partial<Branch>): Promise<ApiResponse<Branch>> {
    await sleep(DELAY);
    const branch: Branch = {
      id: generateId(), name: data.name || "", address: data.address || "",
      phone: data.phone || "", email: data.email || "", managerId: data.managerId,
      isActive: data.isActive ?? true, createdAt: nowIso(), updatedAt: nowIso(),
    };
    mockBranches.push(branch);
    return wrap(branch);
  },

  async updateBranch(id: string, data: Partial<Branch>): Promise<ApiResponse<Branch>> {
    await sleep(DELAY);
    const branch = findOrThrow(mockBranches, id, "Branch");
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    Object.assign(branch, patch, { updatedAt: nowIso() });
    return wrap(branch);
  },

  /** Refuses (the mock's 409) while the branch still has members or memberships. */
  async deleteBranch(id: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    findOrThrow(mockBranches, id, "Branch");
    if (mockUsers.some((u) => u.branchId === id)) {
      throw new Error("این شعبه عضو فعال دارد و قابل حذف نیست");
    }
    if (mockMemberships.some((m) => m.branchId === id)) {
      throw new Error("این شعبه اشتراک فعال دارد و قابل حذف نیست");
    }
    mockBranches.splice(mockBranches.findIndex((b) => b.id === id), 1);
    return wrap(undefined);
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
      features: data.features || [], isActive: data.isActive ?? true,
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

  /**
   * Soft delete (`isActive = false`) while memberships still reference the
   * plan, hard delete otherwise. Returns the plan either way so the caller can
   * name it in a toast.
   */
  async deleteMembershipPlan(id: string): Promise<ApiResponse<MembershipPlan>> {
    await sleep(DELAY / 2);
    const plan = findOrThrow(mockPlans, id, "Plan");
    const isReferenced = mockMemberships.some((m) => m.planId === id);

    if (isReferenced) {
      plan.isActive = false;
      plan.updatedAt = nowIso();
      return wrap(plan);
    }

    mockPlans.splice(mockPlans.findIndex((p) => p.id === id), 1);
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

  async createMembership(data: MembershipInput): Promise<ApiResponse<Membership>> {
    await sleep(DELAY);
    const sessionsTotal = data.sessionsTotal ?? 0;
    const sessionsUsed = data.sessionsUsed ?? 0;
    const membership: Membership = {
      id: generateId(),
      userId: data.userId,
      planId: data.planId,
      branchId: data.branchId,
      startDate: data.startDate,
      endDate: data.endDate,
      sessionsTotal,
      sessionsUsed,
      // Derived server-side on every read, never sent by the client.
      sessionsRemaining: sessionsTotal - sessionsUsed,
      price: data.price,
      discountAmount: data.discountAmount ?? 0,
      finalPrice: data.finalPrice,
      status: data.status ?? "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    mockMemberships.push(membership);
    return wrap(membership);
  },

  async updateMembership(id: string, data: Partial<MembershipInput>): Promise<ApiResponse<Membership>> {
    await sleep(DELAY);
    const membership = findOrThrow(mockMemberships, id, "Membership");
    Object.assign(membership, data, { updatedAt: nowIso() });
    // Keep the derived field in step with whichever of the two moved.
    membership.sessionsRemaining = membership.sessionsTotal - membership.sessionsUsed;
    return wrap(membership);
  },

  /**
   * The server refuses to freeze anything that is not currently `active`
   * (400), so re-freezing a frozen membership is an error rather than a no-op.
   * Mirrored here: in mock mode the admin screen must take the same failure
   * branch it will take against the real API.
   */
  async freezeMembership(id: string, data: { reason?: string; endDate?: string }): Promise<ApiResponse<Membership>> {
    await sleep(DELAY / 2);
    const membership = findOrThrow(mockMemberships, id, "Membership");
    if (membership.status !== "active") {
      throw new Error("فقط عضویت فعال را می‌توان مسدود کرد");
    }
    membership.status = "frozen";
    membership.freezeReason = data.reason;
    membership.freezeEndDate = data.endDate;
    membership.updatedAt = nowIso();
    return wrap(membership);
  },

  /** Mirrors the server's 400 when the membership is not frozen. */
  async unfreezeMembership(id: string): Promise<ApiResponse<Membership>> {
    await sleep(DELAY / 2);
    const membership = findOrThrow(mockMemberships, id, "Membership");
    if (membership.status !== "frozen") {
      throw new Error("این عضویت مسدود نیست");
    }
    membership.status = "active";
    membership.freezeReason = undefined;
    membership.freezeEndDate = undefined;
    membership.updatedAt = nowIso();
    return wrap(membership);
  },

  async deductSession(id: string): Promise<ApiResponse<Membership>> {
    await sleep(DELAY / 2);
    const membership = findOrThrow(mockMemberships, id, "Membership");
    if (membership.sessionsRemaining <= 0) throw new Error("جلسه‌ای برای کسر باقی نمانده است");
    membership.sessionsUsed += 1;
    membership.sessionsRemaining -= 1;
    membership.updatedAt = nowIso();
    return wrap(membership);
  },

  /** Mirrors `POST /memberships/{id}/renew`: new term, reactivation, reset. */
  async renewMembership(
    id: string,
    data: { endDate: string; sessionsTotal?: number; resetSessionsUsed?: boolean },
  ): Promise<ApiResponse<Membership>> {
    await sleep(DELAY / 2);
    const membership = findOrThrow(mockMemberships, id, "Membership");
    if (new Date(data.endDate).getTime() <= new Date(membership.startDate).getTime()) {
      throw new Error("تاریخ پایان دوره جدید باید بعد از شروع دوره باشد");
    }
    membership.endDate = data.endDate;
    membership.status = "active";
    membership.freezeReason = undefined;
    membership.freezeEndDate = undefined;
    if (data.sessionsTotal !== undefined) membership.sessionsTotal = data.sessionsTotal;
    if (data.resetSessionsUsed !== false) {
      membership.sessionsUsed = 0;
      membership.sessionsRemaining = membership.sessionsTotal;
    }
    membership.updatedAt = nowIso();
    return wrap(membership);
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
      // Server defaults ("general"/"beginner") when the caller omits them.
      id: generateId(), name: data.name || "", category: data.category || "general",
      muscleGroup: data.muscleGroup || "general", difficulty: data.difficulty || "beginner",
      equipment: data.equipment || "", isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    mockExercises.push(ex);
    return wrap(ex);
  },

  async updateExercise(id: string, data: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    await sleep(DELAY);
    const exercise = findOrThrow(mockExercises, id, "Exercise");
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    Object.assign(exercise, patch, { updatedAt: nowIso() });
    return wrap(exercise);
  },

  /** Refuses (the mock's 409) while a program exercise still references it. */
  async deleteExercise(id: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    findOrThrow(mockExercises, id, "Exercise");
    const isReferenced = getMockPrograms().some((p) => p.exercises.some((e) => e.exerciseId === id));
    if (isReferenced) throw new Error("این حرکت در یک برنامه تمرینی استفاده شده و قابل حذف نیست");
    mockExercises.splice(mockExercises.findIndex((e) => e.id === id), 1);
    return wrap(undefined);
  },

  // === Training Programs ===
  async getTrainingPrograms(): Promise<PaginatedResponse<TrainingProgram>> {
    await sleep(DELAY);
    return wrapList(getMockPrograms());
  },

  async getTrainingProgram(id: string): Promise<ApiResponse<TrainingProgram>> {
    await sleep(DELAY / 2);
    return wrap(findOrThrow(getMockPrograms(), id, "Program"));
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
    // Into the shared store, not just the response: the builder's next step is
    // to add exercises to the program it has only just created.
    getMockPrograms().push(prog);
    return wrap(prog);
  },

  async updateTrainingProgram(id: string, data: Partial<TrainingProgram>): Promise<ApiResponse<TrainingProgram>> {
    await sleep(DELAY);
    const prog = findOrThrow(getMockPrograms(), id, "Program");
    // `exercises` is owned by the three calls below; a partial program edit must
    // not be able to wipe the list by omitting it.
    const { exercises: _ignored, ...rest } = data;
    Object.assign(prog, rest, { updatedAt: nowIso() });
    return wrap(prog);
  },

  async deleteTrainingProgram(id: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    const programs = getMockPrograms();
    const idx = programs.findIndex((p) => p.id === id);
    if (idx >= 0) programs.splice(idx, 1);
    return wrap(undefined);
  },

  async addProgramExercise(
    programId: string,
    data: ProgramExerciseInput & { exerciseId: string; dayOfWeek: number },
  ): Promise<ApiResponse<ProgramExercise>> {
    await sleep(DELAY / 2);
    const prog = findOrThrow(getMockPrograms(), programId, "Program");
    const entry: ProgramExercise = {
      id: generateId(),
      programId,
      exerciseId: data.exerciseId,
      // The real API joins the exercise row in; the UI renders its name, so the
      // mock has to resolve it too or every new row reads as untitled.
      exercise: mockExercises.find((e) => e.id === data.exerciseId),
      dayOfWeek: data.dayOfWeek,
      // Appended to that day by default, which is where a builder adds one.
      order: data.order ?? prog.exercises.filter((e) => e.dayOfWeek === data.dayOfWeek).length,
      sets: data.sets ?? 3,
      reps: data.reps ?? "10",
      weight: data.weight,
      restSeconds: data.restSeconds ?? 60,
      notes: data.notes,
      isCompleted: false,
    };
    prog.exercises.push(entry);
    prog.updatedAt = nowIso();
    return wrap(entry);
  },

  /** Partial, like the real `PUT`: an omitted field keeps its stored value. */
  async updateProgramExercise(
    programId: string,
    exerciseId: string,
    data: ProgramExerciseInput,
  ): Promise<ApiResponse<ProgramExercise>> {
    await sleep(DELAY / 2);
    const prog = findOrThrow(getMockPrograms(), programId, "Program");
    const entry = findOrThrow(prog.exercises, exerciseId, "Exercise in program");
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) Object.assign(entry, { [key]: value });
    }
    if (data.exerciseId) entry.exercise = mockExercises.find((e) => e.id === data.exerciseId);
    prog.updatedAt = nowIso();
    return wrap(entry);
  },

  async deleteProgramExercise(programId: string, exerciseId: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    const prog = findOrThrow(getMockPrograms(), programId, "Program");
    const idx = prog.exercises.findIndex((e) => e.id === exerciseId);
    if (idx < 0) throw new Error("Exercise not found in program");
    prog.exercises.splice(idx, 1);
    prog.updatedAt = nowIso();
    return wrap(undefined);
  },

  /**
   * Marks a program exercise complete (or, with `completed: false`, undoes it).
   * Writes into the shared program store so the change survives the next
   * `getTrainingProgram` / dashboard fetch. Scoped to the program like the
   * server (which 404s across programs), and undoing clears actuals to null
   * rather than a misleading 0-sets record.
   */
  async completeProgramExercise(programId: string, exerciseId: string, completed = true, data?: Record<string, unknown>): Promise<ApiResponse<ProgramExercise>> {
    await sleep(DELAY / 2);
    const prog = findOrThrow(getMockPrograms(), programId, "Program");
    const ex = prog.exercises.find((e) => e.id === exerciseId);
    if (!ex) throw new Error("Exercise not found in program");
    ex.isCompleted = completed;
    ex.completedAt = completed ? nowIso() : undefined;
    ex.actualSets = typeof data?.actualSets === "number" ? data.actualSets : completed ? ex.sets : undefined;
    if (typeof data?.actualReps === "string") ex.actualReps = data.actualReps;
    if (typeof data?.actualWeight === "number") ex.actualWeight = data.actualWeight;
    return wrap(ex);
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
      id: generateId(), athleteId: data.athleteId || "", coachId: data.coachId,
      title: data.title || "", description: data.description,
      targetValue: data.targetValue || 0, currentValue: 0, unit: data.unit || "",
      category: data.category || "custom", startDate: data.startDate || new Date().toISOString(),
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
    // A zero target has no percentage — the hook guards the same way, so the
    // demo and the API agree instead of flashing NaN/Infinity.
    goal.progressPercentage = goal.targetValue > 0
      ? Math.min(100, Math.round((currentValue / goal.targetValue) * 100))
      : 0;
    if (goal.progressPercentage >= 100) goal.status = "achieved";
    else goal.status = "in_progress";
    goal.updatedAt = new Date().toISOString();
    return wrap(goal);
  },

  async updateGoal(id: string, data: Partial<Goal>): Promise<ApiResponse<Goal>> {
    await sleep(DELAY);
    const goal = findOrThrow(mockGoals, id, "Goal");
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    Object.assign(goal, patch, { updatedAt: nowIso() });
    if (goal.targetValue > 0) {
      goal.progressPercentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    }
    return wrap(goal);
  },

  async deleteGoal(id: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    findOrThrow(mockGoals, id, "Goal");
    mockGoals.splice(mockGoals.findIndex((g) => g.id === id), 1);
    return wrap(undefined);
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

  /**
   * Backfills a missed checkout at an explicit time. Mirrors the server's two
   * refusals: an already-closed session is an error rather than an overwrite,
   * and a time before the check-in would yield a negative duration.
   */
  async checkOutAt(id: string, checkOutTime: string): Promise<ApiResponse<CheckIn>> {
    await sleep(DELAY);
    const ci = findOrThrow(mockCheckIns, id, "CheckIn");
    if (ci.checkOutTime) throw new Error("این حضور قبلاً بسته شده است");
    const diff = new Date(checkOutTime).getTime() - new Date(ci.checkInTime).getTime();
    if (!Number.isFinite(diff) || diff < 0) throw new Error("زمان خروج باید بعد از زمان ورود باشد");
    ci.checkOutTime = checkOutTime;
    ci.durationMinutes = Math.round(diff / 60000);
    return wrap(ci);
  },

  /** Mirrors `DELETE /check-ins/{id}`: voids an erroneous record entirely. */
  async voidCheckIn(id: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    const idx = mockCheckIns.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("حضوری با این شناسه یافت نشد");
    mockCheckIns.splice(idx, 1);
    return wrap(undefined);
  },

  /**
   * Mirrors `POST /check-ins/qr/check-in`: the code is the member's id.
   * Refuses an already-open session, like the server.
   */
  async qrCheckIn(data: { code: string; branchId?: string }): Promise<ApiResponse<CheckIn>> {
    await sleep(DELAY);
    const member = findOrThrow(mockUsers, data.code, "User");
    const open = mockCheckIns.find((c) => c.userId === member.id && !c.checkOutTime);
    if (open) throw new Error("این عضو در حال حاضر داخل باشگاه است");
    const checkIn: CheckIn = {
      id: generateId(),
      userId: member.id,
      branchId: data.branchId ?? mockBranches[0]?.id ?? "",
      checkInTime: new Date().toISOString(),
      sessionDeducted: true,
      createdAt: new Date().toISOString(),
    };
    mockCheckIns.push(checkIn);
    return wrap(checkIn);
  },

  // === Readiness ===
  /**
   * Mirrors `GET /readiness/history`. Mock mode keeps readiness in
   * localStorage (`readiness:{userId}:{day}`), so history is whatever the
   * member actually logged; missing recent days are backfilled with stable
   * demo states (hashed, so they survive reloads) to keep the energy view
   * meaningful in the offline demo.
   */
  async getReadinessHistory(params?: { userId?: string; days?: number }): Promise<ApiResponse<{ day: string; state: string }[]>> {
    await sleep(DELAY / 2);
    const days = Math.min(Math.max(params?.days ?? 14, 1), 60);
    const userId = params?.userId ?? "";
    const stored = new Map<string, string>();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) ?? "";
        const m = key.match(/^readiness:(.+):(\d{4}-\d{2}-\d{2})$/);
        if (m && (userId === "" || m[1] === userId)) stored.set(m[2], localStorage.getItem(key) ?? "");
      }
    } catch { /* non-browser or denied storage: demo backfill only */ }
    const STATES = ["energized", "pumped", "recovered", "sore", "fatigued"] as const;
    const rows: { day: string; state: string }[] = [];
    const now = new Date();
    for (let back = 0; back < days; back++) {
      const d = new Date(now);
      d.setDate(d.getDate() - back);
      const day = d.toISOString().slice(0, 10);
      const logged = stored.get(day);
      if (logged) {
        rows.push({ day, state: logged });
        continue;
      }
      if (back === 0) continue; // today with no log: genuinely empty
      let h = 0;
      for (const ch of `${userId}:${day}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      rows.push({ day, state: STATES[h % STATES.length] });
    }
    return wrap(rows);
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
    // The server forces every new payment to `pending` with no paid stamp —
    // the old hardcoded `completed` made the demo skip the staff-confirm step.
    const payment: Payment = {
      id: generateId(), userId: data.userId || "", membershipId: data.membershipId,
      amount: data.amount || 0,
      currency: data.currency || "ریال", status: "pending", method: data.method || "card",
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPayments.push(payment);
    return wrap(payment);
  },

  async updatePayment(id: string, data: {
    status?: "pending" | "completed" | "failed" | "refunded"; method?: Payment["method"]; notes?: string;
  }): Promise<ApiResponse<Payment>> {
    await sleep(DELAY);
    const payment = findOrThrow(mockPayments, id, "Payment");
    if (data.status) payment.status = data.status;
    if (data.method) payment.method = data.method;
    if (data.notes !== undefined) payment.description = data.notes;
    // Completing a payment stamps it; reversing one clears the stamp.
    if (data.status === "completed" && !payment.paidAt) payment.paidAt = nowIso();
    if (data.status === "refunded" || data.status === "failed") payment.paidAt = undefined;
    payment.updatedAt = nowIso();
    return wrap({ ...payment, user: mockUsers.find((u) => u.id === payment.userId) });
  },

  /** Status-only transition; unlike `updatePayment` this one accepts `cancelled`. */
  async updatePaymentStatus(id: string, status: Payment["status"]): Promise<ApiResponse<Payment>> {
    await sleep(DELAY / 2);
    const payment = findOrThrow(mockPayments, id, "Payment");
    payment.status = status;
    if (status === "completed" && !payment.paidAt) payment.paidAt = nowIso();
    if (status === "refunded" || status === "failed" || status === "cancelled") payment.paidAt = undefined;
    payment.updatedAt = nowIso();
    return wrap({ ...payment, user: mockUsers.find((u) => u.id === payment.userId) });
  },

  // === Notifications ===
  async getNotifications(userId: string): Promise<PaginatedResponse<Notification>> {
    await sleep(DELAY / 2);
    // Memoise on first read, otherwise marking one read would not stick for
    // users that are not in the seeded record.
    mockNotifications[userId] ??= createMockNotifications(userId);
    return wrapList(mockNotifications[userId]);
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

  /**
   * Scans every user's bucket for the id, like `markNotificationRead` above:
   * the mock store is keyed by user but the route is not, and the server scopes
   * the delete to the caller by returning 404 for someone else's row.
   */
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    await sleep(DELAY / 2);
    for (const key of Object.keys(mockNotifications)) {
      const i = mockNotifications[key].findIndex((x) => x.id === id);
      if (i !== -1) {
        mockNotifications[key].splice(i, 1);
        return wrap(undefined);
      }
    }
    throw new Error("Notification not found");
  },

  async createNotification(data: {
    userId: string; title: string; message: string; type?: Notification["type"];
  }): Promise<ApiResponse<Notification>> {
    await sleep(DELAY);
    const notification: Notification = {
      id: generateId(), userId: data.userId, title: data.title,
      message: data.message, type: data.type || "info", isRead: false,
      createdAt: nowIso(),
    };
    mockNotifications[data.userId] ??= createMockNotifications(data.userId);
    mockNotifications[data.userId].unshift(notification);
    return wrap(notification);
  },

  async broadcastNotification(data: {
    title: string; message: string; type?: Notification["type"]; role?: UserRole; branchId?: string;
  }): Promise<ApiResponse<{ sent: number }>> {
    await sleep(DELAY);
    const recipients = mockUsers.filter((u) =>
      (!data.role || u.role === data.role) && (!data.branchId || u.branchId === data.branchId));

    for (const recipient of recipients) {
      mockNotifications[recipient.id] ??= createMockNotifications(recipient.id);
      mockNotifications[recipient.id].unshift({
        id: generateId(), userId: recipient.id, title: data.title,
        message: data.message, type: data.type || "info", isRead: false,
        createdAt: nowIso(),
      });
    }

    return wrap({ sent: recipients.length });
  },

  // === Profile ===
  async updateProfile(userId: string, data: {
    firstName?: string; lastName?: string; phone?: string; avatarUrl?: string;
  }): Promise<ApiResponse<User>> {
    await sleep(DELAY);
    const user = findOrThrow(mockUsers, userId, "User");
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    Object.assign(user, patch, { updatedAt: nowIso() });
    return wrap(user);
  },

  // === Password reset / change ===
  /**
   * Always reports success so the caller cannot probe which emails exist. When
   * the address does match a user, a 30-minute single-use token is issued and
   * handed back as `devToken` — the offline stand-in for the reset email, which
   * this project has no SMTP service to send.
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ sent: boolean; devToken?: string }>> {
    await sleep(DELAY);
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) return wrap({ sent: true });

    // Issuing a new token invalidates any outstanding one for that user.
    for (let i = mockResetTokens.length - 1; i >= 0; i -= 1) {
      if (mockResetTokens[i].userId === user.id && !mockResetTokens[i].usedAt) {
        mockResetTokens.splice(i, 1);
      }
    }

    const token = `${generateId()}${generateId()}`;
    mockResetTokens.push({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    });
    console.info(`[mock] password reset link: /auth/reset-password?token=${token}`);
    return wrap({ sent: true, devToken: token });
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ reset: boolean }>> {
    await sleep(DELAY);
    const record = mockResetTokens.find((t) => t.token === token);
    if (!record) throw new Error("لینک بازیابی نامعتبر است");
    if (record.usedAt) throw new Error("این لینک بازیابی قبلاً استفاده شده است");
    if (new Date(record.expiresAt).getTime() < Date.now()) throw new Error("لینک بازیابی منقضی شده است");
    assertPasswordPolicy(password);

    mockPasswords[record.userId] = password;
    record.usedAt = nowIso();
    return wrap({ reset: true });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ApiResponse<{ changed: boolean }>> {
    await sleep(DELAY);
    findOrThrow(mockUsers, userId, "User");
    if (currentPassword !== passwordOf(userId)) throw new Error("رمز عبور فعلی اشتباه است");
    assertPasswordPolicy(newPassword);

    mockPasswords[userId] = newPassword;
    return wrap({ changed: true });
  },

  // === Analytics ===
  async getAttendanceTrend(days = 30): Promise<PaginatedResponse<AttendanceTrendPoint>> {
    await sleep(DELAY);
    return wrapList(createAttendanceTrend(days));
  },

  async getRevenueTrend(months = 6): Promise<PaginatedResponse<RevenueTrendPoint>> {
    await sleep(DELAY);
    return wrapList(createRevenueTrend(months));
  },

  /** Daily is a fixed 30-day window server-side; monthly agrees with `getRevenueTrend`. */
  async getRevenueSeries(params?: { period?: "daily" | "monthly"; months?: number }): Promise<ApiResponse<RevenueSeries>> {
    await sleep(DELAY);
    return wrap(createRevenueSeries(params?.period ?? "monthly", params?.months ?? 6));
  },

  /** Derived from the in-memory memberships, so plan CRUD is reflected here. */
  async getMembershipDistribution(): Promise<PaginatedResponse<MembershipDistributionSlice>> {
    await sleep(DELAY);
    const byPlan = new Map<string, { count: number; revenue: number }>();
    for (const membership of mockMemberships) {
      const slice = byPlan.get(membership.planId) ?? { count: 0, revenue: 0 };
      slice.count += 1;
      slice.revenue += membership.finalPrice;
      byPlan.set(membership.planId, slice);
    }

    const slices = [...byPlan.entries()]
      .map(([planId, slice]) => ({
        planId,
        planName: mockPlans.find((p) => p.id === planId)?.name ?? planId,
        count: slice.count,
        revenue: slice.revenue,
      }))
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue);

    return wrapList(slices);
  },

  async getPeakHours(days = 30): Promise<PaginatedResponse<PeakHourPoint>> {
    await sleep(DELAY);
    return wrapList(createPeakHours(days));
  },

  async getAthleteActivity(athleteId: string, days = 30): Promise<PaginatedResponse<AthleteActivityPoint>> {
    await sleep(DELAY);
    return wrapList(createAthleteActivity(athleteId, days));
  },

  // === Messaging ===
  async getConversations(userId: string): Promise<PaginatedResponse<Conversation>> {
    await sleep(DELAY);
    const conversations = visibleConversationRows(userId)
      .map((row) => conversationFor(row, userId))
      .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
    return wrapList(conversations);
  },

  /** Idempotent: an existing `(athlete, coach)` pair is returned as-is. */
  async createConversation(userId: string, participantId: string): Promise<ApiResponse<Conversation>> {
    await sleep(DELAY);
    const viewer = findOrThrow(mockUsers, userId, "User");
    const other = findOrThrow(mockUsers, participantId, "User");
    // A conversation is keyed by (athlete, coach); the caller is the athlete
    // only when their own role says so.
    const athleteSide = viewer.role === "athlete" ? viewer : other;
    const coachSide = viewer.role === "athlete" ? other : viewer;

    const existing = mockConversationRows.find(
      (row) => row.athleteId === athleteSide.id && row.coachId === coachSide.id);
    if (existing) return wrap(conversationFor(existing, userId));

    const row: MockConversationRow = {
      id: generateId(), athleteId: athleteSide.id, coachId: coachSide.id,
      lastMessageAt: nowIso(), createdAt: nowIso(), updatedAt: nowIso(),
    };
    mockConversationRows.push(row);
    return wrap(conversationFor(row, userId));
  },

  async getConversation(userId: string, id: string): Promise<ApiResponse<Conversation>> {
    await sleep(DELAY / 2);
    const row = findOrThrow(visibleConversationRows(userId), id, "Conversation");
    return wrap(conversationFor(row, userId));
  },

  async getMessages(conversationId: string): Promise<PaginatedResponse<ChatMessage>> {
    await sleep(DELAY / 2);
    findOrThrow(mockConversationRows, conversationId, "Conversation");
    return wrapList(messagesOf(conversationId));
  },

  async sendMessage(conversationId: string, body: string, senderId: string): Promise<ApiResponse<ChatMessage>> {
    await sleep(DELAY / 2);
    const row = findOrThrow(mockConversationRows, conversationId, "Conversation");
    const text = body.trim();
    if (!text) throw new Error("متن پیام نمی‌تواند خالی باشد");
    if (text.length > 2000) throw new Error("متن پیام حداکثر ۲۰۰۰ کاراکتر است");

    const message: ChatMessage = {
      id: generateId(), conversationId, senderId, body: text,
      readAt: null, createdAt: nowIso(),
    };
    mockChatMessages.push(message);
    row.lastMessageAt = message.createdAt;
    row.updatedAt = message.createdAt;
    return wrap(message);
  },

  /** Marks every message *not* sent by the caller as read. */
  async markConversationRead(conversationId: string, userId: string): Promise<ApiResponse<{ updated: number }>> {
    await sleep(DELAY / 3);
    findOrThrow(mockConversationRows, conversationId, "Conversation");
    const unread = messagesOf(conversationId).filter((m) => m.senderId !== userId && !m.readAt);
    const readAt = nowIso();
    unread.forEach((m) => { m.readAt = readAt; });
    return wrap({ updated: unread.length });
  },

  async getUnreadMessageCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    await sleep(DELAY / 3);
    const count = visibleConversationRows(userId)
      .flatMap((row) => messagesOf(row.id))
      .filter((m) => m.senderId !== userId && !m.readAt).length;
    return wrap({ count });
  },
};
