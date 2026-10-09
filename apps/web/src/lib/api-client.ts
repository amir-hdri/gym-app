import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserRole,
  UserStatus,
  Branch,
  MembershipPlan,
  Membership,
  MembershipInput,
  Exercise,
  TrainingProgram,
  ProgramExercise,
  ProgramExerciseInput,
  Goal,
  CheckIn,
  Payment,
  Notification,
  DashboardStats,
  AthleteDashboardData,
  CoachDashboardData,
  AuthTokens,
  Conversation,
  ChatMessage,
  AttendanceTrendPoint,
  RevenueTrendPoint,
  RevenueSeries,
  MembershipDistributionSlice,
  PeakHourPoint,
  AthleteActivityPoint,
} from "./types";

export interface AuthPayload {
  user: User;
  tokens: AuthTokens;
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = RAW_API_URL.replace(/\/$/, "");

export class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== "undefined") {
          // Short sessions ("remember me" off) live in sessionStorage.
          const tokens =
            localStorage.getItem("auth_tokens") ?? sessionStorage.getItem("auth_tokens");
          if (tokens) {
            try {
              const { accessToken } = JSON.parse(tokens);
              if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
              }
            } catch {
              // invalid token
            }
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Unauthenticated-by-design routes must never trigger a refresh:
        // forgot-password is called with no tokens at all, and logout has
        // already wiped them — refreshing there only manufactures a failure.
        const isAuthRequest = originalRequest?.url?.startsWith("/auth/") &&
          ["/auth/login", "/auth/register", "/auth/refresh", "/auth/reset-password", "/auth/forgot-password", "/auth/logout"].includes(originalRequest.url);
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
          if (this.isRefreshing) {
            originalRequest._retry = true;
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Tokens may live in either store ("remember me" decides).
            const inLocal = localStorage.getItem("auth_tokens");
            const tokens = inLocal ?? (typeof window !== "undefined" ? sessionStorage.getItem("auth_tokens") : null);
            if (tokens) {
              const { refreshToken } = JSON.parse(tokens);
              const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken });

              if (response.data.success && response.data.data) {
                const newTokens = response.data.data;
                (inLocal ? localStorage : sessionStorage).setItem("auth_tokens", JSON.stringify(newTokens));

                this.failedQueue.forEach(({ resolve }) => resolve(newTokens.accessToken));
                this.failedQueue = [];

                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                return this.client(originalRequest);
              }
            }
            throw error;
          } catch (refreshError) {
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            if (typeof window !== "undefined") {
              for (const store of [localStorage, sessionStorage]) {
                store.removeItem("auth_tokens");
                store.removeItem("auth_user");
              }
              // This interceptor is outside React; a full reload clears every
              // cached private query as well as navigating to sign-in.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = "/auth/login";
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async getReadiness(): Promise<ApiResponse<{ day: string; state: string | null }>> {
    return (await this.client.get<ApiResponse<{ day: string; state: string | null }>>("/readiness")).data;
  }
  async saveReadiness(state: string): Promise<ApiResponse<{ day: string; state: string | null }>> {
    return (await this.client.put<ApiResponse<{ day: string; state: string | null }>>("/readiness", { state })).data;
  }
  /**
   * Recent readiness rows, newest first. Staff may pass another member's id
   * (coaches: own athletes); athletes omit it for their own history.
   */
  async getReadinessHistory(params?: { userId?: string; days?: number }): Promise<ApiResponse<{ day: string; state: string }[]>> {
    return (await this.client.get<ApiResponse<{ day: string; state: string }[]>>("/readiness/history", { params })).data;
  }

  private async remainingPages<T>(first: PaginatedResponse<T>, path: string, params?: Record<string, unknown>): Promise<PaginatedResponse<T>> {
    if (params?.page !== undefined || !first.meta || first.meta.totalPages <= 1) return first;
    const rows = [...(first.data ?? [])];
    for (let page = first.meta.page + 1; page <= first.meta.totalPages; page++) {
      const next = await this.client.get<PaginatedResponse<T>>(path, { params: { ...params, page, page_size: first.meta.pageSize } });
      rows.push(...(next.data.data ?? []));
    }
    return { ...first, data: rows, meta: { ...first.meta, page: 1, pageSize: rows.length, totalPages: rows.length ? 1 : 0 } };
  }

  // ---- Auth ----
  async login(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<ApiResponse<AuthPayload>> {
    // rememberMe is client-only; the backend accepts email+password only.
    const { email, password } = credentials;
    const res = await this.client.post<ApiResponse<AuthPayload>>("/auth/login", { email, password });
    return res.data;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; phone: string; branchId?: string }): Promise<ApiResponse<AuthPayload>> {
    const res = await this.client.post<ApiResponse<AuthPayload>>("/auth/register", data);
    return res.data;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const res = await this.client.post<ApiResponse<AuthTokens>>("/auth/refresh", { refreshToken });
    return res.data;
  }

  async logout(): Promise<ApiResponse> {
    const res = await this.client.post<ApiResponse>("/auth/logout");
    return res.data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const res = await this.client.get<ApiResponse<User>>("/auth/profile");
    return res.data;
  }

  async updateProfile(data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }): Promise<ApiResponse<User>> {
    const res = await this.client.put<ApiResponse<User>>("/auth/profile", data);
    return res.data;
  }

  // ---- Password reset / change ----
  /**
   * Always resolves 200 — the backend never reveals whether the email exists.
   * Outside production the response also carries `devToken`, the raw reset
   * token; in production the link arrives by email when SMTP is configured
   * (see docs/API_CONTRACT_V2.md).
   */
  async forgotPassword(data: { email: string }): Promise<ApiResponse<{ sent: boolean; devToken?: string }>> {
    const res = await this.client.post<ApiResponse<{ sent: boolean; devToken?: string }>>("/auth/forgot-password", data);
    return res.data;
  }

  async resetPassword(data: { token: string; password: string }): Promise<ApiResponse<{ reset: boolean }>> {
    const res = await this.client.post<ApiResponse<{ reset: boolean }>>("/auth/reset-password", data);
    return res.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ changed: boolean }>> {
    const res = await this.client.post<ApiResponse<{ changed: boolean }>>("/auth/change-password", data);
    return res.data;
  }

  // ---- Users ----
  async getUsers(params?: Record<string, unknown>): Promise<PaginatedResponse<User>> {
    const res = await this.client.get<PaginatedResponse<User>>("/users", { params });
    return this.remainingPages(res.data, "/users", params);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const res = await this.client.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  }

  async createUser(data: Record<string, unknown>): Promise<ApiResponse<User>> {
    const res = await this.client.post<ApiResponse<User>>("/users", data);
    return res.data;
  }

  async updateUser(id: string, data: Record<string, unknown>): Promise<ApiResponse<User>> {
    const res = await this.client.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data;
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const res = await this.client.delete<ApiResponse>(`/users/${id}`);
    return res.data;
  }

  /**
   * Activates, deactivates or suspends an account.
   *
   * `PUT /users/{id}` would write any string through; this endpoint validates
   * `status` against the server's allow-list and answers 400 for anything else,
   * which is what the admin member/coach lists want.
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<ApiResponse<User>> {
    const res = await this.client.patch<ApiResponse<User>>(`/users/${id}/status`, { status });
    return res.data;
  }

  /**
   * The single way roles change (admin-only): the generic PUT strips `role`
   * and self-registration hardcodes `athlete`. 400 on self or unknown role.
   */
  async updateUserRole(id: string, role: UserRole): Promise<ApiResponse<User>> {
    const res = await this.client.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return res.data;
  }

  /**
   * Sets a user's password.
   *
   * Two callers, one endpoint: a user changing their own must send
   * `currentPassword` (401 if it is missing or wrong), while an admin acting on
   * someone else's account has none to send and omits it. `newPassword` is held
   * to the server's policy — 8+ characters with at least one letter and one
   * digit — and a violation comes back as 422.
   */
  async setUserPassword(
    id: string,
    data: { currentPassword?: string; newPassword: string }
  ): Promise<ApiResponse> {
    const res = await this.client.post<ApiResponse>(`/users/${id}/password`, data);
    return res.data;
  }

  // ---- Branches ----
  async getBranches(): Promise<PaginatedResponse<Branch>> {
    const res = await this.client.get<PaginatedResponse<Branch>>("/branches");
    return this.remainingPages(res.data, "/branches");
  }

  async getBranch(id: string): Promise<ApiResponse<Branch>> {
    const res = await this.client.get<ApiResponse<Branch>>(`/branches/${id}`);
    return res.data;
  }

  async createBranch(data: Record<string, unknown>): Promise<ApiResponse<Branch>> {
    const res = await this.client.post<ApiResponse<Branch>>("/branches", data);
    return res.data;
  }

  async updateBranch(id: string, data: Record<string, unknown>): Promise<ApiResponse<Branch>> {
    const res = await this.client.put<ApiResponse<Branch>>(`/branches/${id}`, data);
    return res.data;
  }

  /** 409 if the branch still has members or memberships. */
  async deleteBranch(id: string): Promise<ApiResponse> {
    const res = await this.client.delete<ApiResponse>(`/branches/${id}`);
    return res.data;
  }

  // ---- Membership Plans ----
  async getMembershipPlans(): Promise<PaginatedResponse<MembershipPlan>> {
    const res = await this.client.get<PaginatedResponse<MembershipPlan>>("/membership-plans");
    return this.remainingPages(res.data, "/membership-plans");
  }

  async getMembershipPlan(id: string): Promise<ApiResponse<MembershipPlan>> {
    const res = await this.client.get<ApiResponse<MembershipPlan>>(`/membership-plans/${id}`);
    return res.data;
  }

  async createMembershipPlan(data: Record<string, unknown>): Promise<ApiResponse<MembershipPlan>> {
    const res = await this.client.post<ApiResponse<MembershipPlan>>("/membership-plans", data);
    return res.data;
  }

  async updateMembershipPlan(id: string, data: Record<string, unknown>): Promise<ApiResponse<MembershipPlan>> {
    const res = await this.client.put<ApiResponse<MembershipPlan>>(`/membership-plans/${id}`, data);
    return res.data;
  }

  /**
   * Soft delete (`isActive = false`) when the plan is referenced by a
   * membership, hard delete otherwise — so `data` may or may not carry the
   * deactivated plan.
   */
  async deleteMembershipPlan(id: string): Promise<ApiResponse<MembershipPlan>> {
    const res = await this.client.delete<ApiResponse<MembershipPlan>>(`/membership-plans/${id}`);
    return res.data;
  }

  // ---- Memberships ----
  async getMemberships(params?: Record<string, unknown>): Promise<PaginatedResponse<Membership>> {
    const res = await this.client.get<PaginatedResponse<Membership>>("/memberships", { params });
    return this.remainingPages(res.data, "/memberships", params);
  }

  async getMembership(id: string): Promise<ApiResponse<Membership>> {
    const res = await this.client.get<ApiResponse<Membership>>(`/memberships/${id}`);
    return res.data;
  }

  async createMembership(data: MembershipInput): Promise<ApiResponse<Membership>> {
    const res = await this.client.post<ApiResponse<Membership>>("/memberships", data);
    return res.data;
  }

  /** Partial: fields left out keep their stored value. */
  async updateMembership(id: string, data: Partial<MembershipInput>): Promise<ApiResponse<Membership>> {
    const res = await this.client.put<ApiResponse<Membership>>(`/memberships/${id}`, data);
    return res.data;
  }

  /** 400 unless the membership is currently `active`. */
  async freezeMembership(id: string, data: { reason?: string; endDate?: string }): Promise<ApiResponse<Membership>> {
    // Backend MembershipUpdate contract uses freezeReason/freezeEndDate.
    const res = await this.client.post<ApiResponse<Membership>>(`/memberships/${id}/freeze`, {
      freezeReason: data.reason,
      freezeEndDate: data.endDate,
    });
    return res.data;
  }

  /** 400 unless the membership is currently `frozen`. */
  async unfreezeMembership(id: string): Promise<ApiResponse<Membership>> {
    const res = await this.client.post<ApiResponse<Membership>>(`/memberships/${id}/unfreeze`);
    return res.data;
  }

  async deductSession(id: string): Promise<ApiResponse<Membership>> {
    const res = await this.client.post<ApiResponse<Membership>>(`/memberships/${id}/deduct-session`);
    return res.data;
  }

  /**
   * Starts a new term: pushes the end date out, reactivates (clearing any
   * freeze) and resets session counters unless told otherwise. Staff may
   * renew anyone; athletes their own. Payment for the term is recorded
   * separately via `createPayment`.
   */
  async renewMembership(id: string, data: { endDate: string; sessionsTotal?: number; resetSessionsUsed?: boolean }): Promise<ApiResponse<Membership>> {
    const res = await this.client.post<ApiResponse<Membership>>(`/memberships/${id}/renew`, data);
    return res.data;
  }

  // ---- Training Programs ----
  async getTrainingPrograms(params?: Record<string, unknown>): Promise<PaginatedResponse<TrainingProgram>> {
    const res = await this.client.get<PaginatedResponse<TrainingProgram>>("/training-programs", { params });
    return this.remainingPages(res.data, "/training-programs", params);
  }

  async getTrainingProgram(id: string): Promise<ApiResponse<TrainingProgram>> {
    const res = await this.client.get<ApiResponse<TrainingProgram>>(`/training-programs/${id}`);
    return res.data;
  }

  async createTrainingProgram(data: Record<string, unknown>): Promise<ApiResponse<TrainingProgram>> {
    const res = await this.client.post<ApiResponse<TrainingProgram>>("/training-programs", data);
    return res.data;
  }

  async updateTrainingProgram(id: string, data: Record<string, unknown>): Promise<ApiResponse<TrainingProgram>> {
    const res = await this.client.put<ApiResponse<TrainingProgram>>(`/training-programs/${id}`, data);
    return res.data;
  }

  async deleteTrainingProgram(id: string): Promise<ApiResponse> {
    const res = await this.client.delete<ApiResponse>(`/training-programs/${id}`);
    return res.data;
  }

  async completeProgramExercise(programId: string, exerciseId: string, data: Record<string, unknown>): Promise<ApiResponse<ProgramExercise>> {
    const res = await this.client.post<ApiResponse<ProgramExercise>>(`/training-programs/${programId}/exercises/${exerciseId}/complete`, data);
    return res.data;
  }

  // The program builder's three writes. A coach may only touch their own
  // programs (403 otherwise); an admin may touch any.
  async addProgramExercise(
    programId: string,
    data: ProgramExerciseInput & { exerciseId: string; dayOfWeek: number }
  ): Promise<ApiResponse<ProgramExercise>> {
    const res = await this.client.post<ApiResponse<ProgramExercise>>(`/training-programs/${programId}/exercises`, data);
    return res.data;
  }

  /** Partial: fields left out keep their stored value. */
  async updateProgramExercise(
    programId: string,
    exerciseId: string,
    data: ProgramExerciseInput
  ): Promise<ApiResponse<ProgramExercise>> {
    const res = await this.client.put<ApiResponse<ProgramExercise>>(`/training-programs/${programId}/exercises/${exerciseId}`, data);
    return res.data;
  }

  async deleteProgramExercise(programId: string, exerciseId: string): Promise<ApiResponse> {
    const res = await this.client.delete<ApiResponse>(`/training-programs/${programId}/exercises/${exerciseId}`);
    return res.data;
  }

  // ---- Exercises ----
  async getExercises(params?: Record<string, unknown>): Promise<PaginatedResponse<Exercise>> {
    const res = await this.client.get<PaginatedResponse<Exercise>>("/exercises", { params });
    return this.remainingPages(res.data, "/exercises", params);
  }

  async getExercise(id: string): Promise<ApiResponse<Exercise>> {
    const res = await this.client.get<ApiResponse<Exercise>>(`/exercises/${id}`);
    return res.data;
  }

  async createExercise(data: Record<string, unknown>): Promise<ApiResponse<Exercise>> {
    const res = await this.client.post<ApiResponse<Exercise>>("/exercises", data);
    return res.data;
  }

  async updateExercise(id: string, data: Record<string, unknown>): Promise<ApiResponse<Exercise>> {
    const res = await this.client.put<ApiResponse<Exercise>>(`/exercises/${id}`, data);
    return res.data;
  }

  /** 409 if the exercise is referenced by a program exercise. */
  async deleteExercise(id: string): Promise<ApiResponse> {
    const res = await this.client.delete<ApiResponse>(`/exercises/${id}`);
    return res.data;
  }

  // ---- Goals ----
  async getGoals(params?: Record<string, unknown>): Promise<PaginatedResponse<Goal>> {
    const res = await this.client.get<PaginatedResponse<Goal>>("/goals", { params });
    return this.remainingPages(res.data, "/goals", params);
  }

  async getGoal(id: string): Promise<ApiResponse<Goal>> {
    const res = await this.client.get<ApiResponse<Goal>>(`/goals/${id}`);
    return res.data;
  }

  async createGoal(data: Record<string, unknown>): Promise<ApiResponse<Goal>> {
    const res = await this.client.post<ApiResponse<Goal>>("/goals", data);
    return res.data;
  }

  async updateGoalProgress(id: string, currentValue: number): Promise<ApiResponse<Goal>> {
    const res = await this.client.post<ApiResponse<Goal>>(`/goals/${id}/progress`, { currentValue });
    return res.data;
  }

  async updateGoal(id: string, data: Record<string, unknown>): Promise<ApiResponse<Goal>> {
    const res = await this.client.put<ApiResponse<Goal>>(`/goals/${id}`, data);
    return res.data;
  }

  async deleteGoal(id: string): Promise<ApiResponse> {
    const res = await this.client.delete<ApiResponse>(`/goals/${id}`);
    return res.data;
  }

  // ---- Check-ins ----
  async checkIn(data: { userId: string; branchId: string }): Promise<ApiResponse<CheckIn>> {
    const res = await this.client.post<ApiResponse<CheckIn>>("/check-ins", data);
    return res.data;
  }

  /** Checks out *now*. 400 if the session is already closed. */
  async checkOut(data: { checkInId: string }): Promise<ApiResponse<CheckIn>> {
    const res = await this.client.post<ApiResponse<CheckIn>>("/check-ins/check-out", data);
    return res.data;
  }

  /**
   * Closes a session at an explicit time instead of now — the reception desk's
   * fix for a member who left without checking out. Separate route from
   * `checkOut` (`PUT /check-ins/{id}/checkout`), not an alias: that one only
   * ever stamps the current time.
   *
   * Still 400 if the session is already closed, so correcting an existing
   * checkout is not possible — only filling in a missing one.
   */
  async checkOutAt(id: string, checkOutTime: string): Promise<ApiResponse<CheckIn>> {
    const res = await this.client.put<ApiResponse<CheckIn>>(`/check-ins/${id}/checkout`, { checkOutTime });
    return res.data;
  }

  async qrCheckIn(data: { code: string }): Promise<ApiResponse<CheckIn>> {
    const res = await this.client.post<ApiResponse<CheckIn>>("/check-ins/qr/check-in", data);
    return res.data;
  }

  async getCheckIns(params?: Record<string, unknown>): Promise<PaginatedResponse<CheckIn>> {
    const res = await this.client.get<PaginatedResponse<CheckIn>>("/check-ins", { params });
    return this.remainingPages(res.data, "/check-ins", params);
  }

  /** Voids an erroneous record (wrong member, accidental scan). Staff-only. */
  async voidCheckIn(id: string): Promise<ApiResponse> {
    const res = await this.client.delete<ApiResponse>(`/check-ins/${id}`);
    return res.data;
  }

  // ---- Payments ----
  async getPayments(params?: Record<string, unknown>): Promise<PaginatedResponse<Payment>> {
    const res = await this.client.get<PaginatedResponse<Payment>>("/payments", { params });
    return this.remainingPages(res.data, "/payments", params);
  }

  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    const res = await this.client.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data;
  }

  async createPayment(data: Record<string, unknown>): Promise<ApiResponse<Payment>> {
    const res = await this.client.post<ApiResponse<Payment>>("/payments", data);
    return res.data;
  }

  async updatePayment(
    id: string,
    data: { status?: "pending" | "completed" | "failed" | "refunded"; method?: Payment["method"]; notes?: string }
  ): Promise<ApiResponse<Payment>> {
    const res = await this.client.put<ApiResponse<Payment>>(`/payments/${id}`, data);
    return res.data;
  }

  /**
   * Transitions a payment's status and nothing else.
   *
   * Preferred over `updatePayment` for a one-click reconcile: it accepts
   * `cancelled`, which `PUT /payments/{id}` rejects with a 422, and it cannot
   * accidentally blank a field the caller did not mean to send.
   */
  async updatePaymentStatus(id: string, status: Payment["status"]): Promise<ApiResponse<Payment>> {
    const res = await this.client.patch<ApiResponse<Payment>>(`/payments/${id}/status`, { status });
    return res.data;
  }

  // ---- Dashboard ----
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const res = await this.client.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return res.data;
  }

  async getAthleteDashboard(athleteId: string): Promise<ApiResponse<AthleteDashboardData>> {
    const res = await this.client.get<ApiResponse<AthleteDashboardData>>(`/dashboard/athlete/${athleteId}`);
    return res.data;
  }

  async getCoachDashboard(coachId: string): Promise<ApiResponse<CoachDashboardData>> {
    const res = await this.client.get<ApiResponse<CoachDashboardData>>(`/dashboard/coach/${coachId}`);
    return res.data;
  }

  // ---- Dashboard analytics ----
  // Series are ascending by date and dense: missing days/months arrive with
  // zero values, so charts never have to interpolate.

  /** `days` defaults to 30 server-side, max 365. */
  async getAttendanceTrend(days?: number): Promise<PaginatedResponse<AttendanceTrendPoint>> {
    const res = await this.client.get<PaginatedResponse<AttendanceTrendPoint>>("/dashboard/attendance-trend", {
      params: days ? { days } : undefined,
    });
    return res.data;
  }

  /** `months` defaults to 6 server-side, max 24. */
  async getRevenueTrend(months?: number): Promise<PaginatedResponse<RevenueTrendPoint>> {
    const res = await this.client.get<PaginatedResponse<RevenueTrendPoint>>("/dashboard/revenue-trend", {
      params: months ? { months } : undefined,
    });
    return res.data;
  }

  /**
   * Revenue as a parallel `{ labels, values }` pair — the only way to get a
   * **daily** revenue series (last 30 days). `getRevenueTrend` is the better
   * choice for monthly: same numbers, but one object per point and a payment
   * count alongside each. Use this one for `period: "daily"` and that one
   * otherwise.
   */
  async getRevenueSeries(params?: { period?: "daily" | "monthly"; months?: number }): Promise<ApiResponse<RevenueSeries>> {
    const res = await this.client.get<ApiResponse<RevenueSeries>>("/dashboard/revenue", { params });
    return res.data;
  }

  async getMembershipDistribution(): Promise<PaginatedResponse<MembershipDistributionSlice>> {
    const res = await this.client.get<PaginatedResponse<MembershipDistributionSlice>>("/dashboard/membership-distribution");
    return res.data;
  }

  /** All 24 hours are present, ascending. */
  async getPeakHours(days?: number): Promise<PaginatedResponse<PeakHourPoint>> {
    const res = await this.client.get<PaginatedResponse<PeakHourPoint>>("/dashboard/peak-hours", {
      params: days ? { days } : undefined,
    });
    return res.data;
  }

  async getAthleteActivity(athleteId: string, days?: number): Promise<PaginatedResponse<AthleteActivityPoint>> {
    const res = await this.client.get<PaginatedResponse<AthleteActivityPoint>>(`/dashboard/athlete/${athleteId}/activity`, {
      params: days ? { days } : undefined,
    });
    return res.data;
  }

  // ---- Notifications ----
  async getNotifications(params?: Record<string, unknown>): Promise<PaginatedResponse<Notification>> {
    const res = await this.client.get<PaginatedResponse<Notification>>("/notifications", { params });
    return this.remainingPages(res.data, "/notifications", params);
  }

  async markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
    const res = await this.client.post<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return res.data;
  }

  async markAllNotificationsRead(): Promise<ApiResponse> {
    const res = await this.client.post<ApiResponse>("/notifications/read-all");
    return res.data;
  }

  /** Scoped to the caller's own notifications — someone else's id is a 404, not a 403. */
  async deleteNotification(id: string): Promise<ApiResponse> {
    const res = await this.client.delete<ApiResponse>(`/notifications/${id}`);
    return res.data;
  }

  async createNotification(data: { userId: string; title: string; message: string; type?: Notification["type"] }): Promise<ApiResponse<Notification>> {
    const res = await this.client.post<ApiResponse<Notification>>("/notifications", data);
    return res.data;
  }

  /** Fans out to every user matching `role` / `branchId` (both optional = everyone). */
  async broadcastNotification(data: {
    title: string;
    message: string;
    type?: Notification["type"];
    role?: UserRole;
    branchId?: string;
  }): Promise<ApiResponse<{ sent: number }>> {
    const res = await this.client.post<ApiResponse<{ sent: number }>>("/notifications/broadcast", data);
    return res.data;
  }

  // ---- Messaging ----
  async getConversations(params?: Record<string, unknown>): Promise<PaginatedResponse<Conversation>> {
    const res = await this.client.get<PaginatedResponse<Conversation>>("/messages/conversations", { params });
    return res.data;
  }

  /** Idempotent: returns the existing conversation when one already exists. */
  async createConversation(data: { participantId: string }): Promise<ApiResponse<Conversation>> {
    const res = await this.client.post<ApiResponse<Conversation>>("/messages/conversations", data);
    return res.data;
  }

  async getConversation(id: string): Promise<ApiResponse<Conversation>> {
    const res = await this.client.get<ApiResponse<Conversation>>(`/messages/conversations/${id}`);
    return res.data;
  }

  /** Ascending by `createdAt`. */
  async getMessages(conversationId: string, params?: Record<string, unknown>): Promise<PaginatedResponse<ChatMessage>> {
    const res = await this.client.get<PaginatedResponse<ChatMessage>>(`/messages/conversations/${conversationId}/messages`, { params });
    return res.data;
  }

  /** `body` must be 1..2000 characters. */
  async sendMessage(conversationId: string, data: { body: string }): Promise<ApiResponse<ChatMessage>> {
    const res = await this.client.post<ApiResponse<ChatMessage>>(`/messages/conversations/${conversationId}/messages`, data);
    return res.data;
  }

  /** Marks every message *not* sent by the caller as read. */
  async markConversationRead(conversationId: string): Promise<ApiResponse<{ updated: number }>> {
    const res = await this.client.post<ApiResponse<{ updated: number }>>(`/messages/conversations/${conversationId}/read`);
    return res.data;
  }

  async getUnreadMessageCount(): Promise<ApiResponse<{ count: number }>> {
    const res = await this.client.get<ApiResponse<{ count: number }>>("/messages/unread-count");
    return res.data;
  }
}

export const api = new ApiClient();
export default api;
