import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Branch,
  MembershipPlan,
  Membership,
  Exercise,
  TrainingProgram,
  ProgramExercise,
  Goal,
  CheckIn,
  QRCheckInResponse,
  Payment,
  Notification,
  DashboardStats,
  AthleteDashboardData,
  CoachDashboardData,
  AuthTokens,
} from "./types";

export interface AuthPayload {
  user: User;
  tokens: AuthTokens;
}

function safeStringify(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : String(value);
  } catch {
    return String(value);
  }
}

/**
 * FastAPI-native errors (422 validation, HTTPException 401/403, 429
 * rate-limit) serialize as {"detail": ...} instead of the ApiResponse envelope
 * ({success, error, message, statusCode}). When the body has `detail` but no
 * `error`/`message`, derive them additively so downstream error handling keeps
 * working. Existing fields are never removed or overwritten.
 */
export function normalizeFastApiError(error: AxiosError): void {
  const response = error.response;
  if (!response) return;
  const body = response.data as Record<string, unknown> | null | undefined;
  if (!body || typeof body !== "object" || Array.isArray(body)) return;
  if (!("detail" in body)) return;
  if ("error" in body || "message" in body) return;
  const text = typeof body.detail === "string" ? body.detail : safeStringify(body.detail);
  response.data = { ...body, error: text, message: text };
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
          const tokens = localStorage.getItem("auth_tokens");
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
        normalizeFastApiError(error);

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
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
            const tokens = localStorage.getItem("auth_tokens");
            if (tokens) {
              const { refreshToken } = JSON.parse(tokens);
              const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken });

              if (response.data.success && response.data.data) {
                const newTokens = response.data.data;
                localStorage.setItem("auth_tokens", JSON.stringify(newTokens));
                this.client.defaults.headers.common.Authorization = `Bearer ${newTokens.accessToken}`;

                this.failedQueue.forEach(({ resolve }) => resolve(newTokens.accessToken));
                this.failedQueue = [];

                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            if (typeof window !== "undefined") {
              localStorage.removeItem("auth_tokens");
              localStorage.removeItem("auth_user");
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

  // ---- Auth ----
  async login(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<ApiResponse<AuthPayload>> {
    // rememberMe is client-only; the backend accepts email+password only.
    const { email, password } = credentials;
    const res = await this.client.post<ApiResponse<AuthPayload>>("/auth/login", { email, password });
    return res.data;
  }

  // Register never returns tokens (anti-enumeration): the response is identical
  // whether or not the email already existed. The user must log in explicitly.
  async register(data: { email: string; password: string; firstName: string; lastName: string; phone: string }): Promise<ApiResponse<null>> {
    const res = await this.client.post<ApiResponse<null>>("/auth/register", data);
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

  // ---- Users ----
  async getUsers(params?: Record<string, unknown>): Promise<PaginatedResponse<User>> {
    const res = await this.client.get<PaginatedResponse<User>>("/users", { params });
    return res.data;
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

  // ---- Branches ----
  // Backend returns success_response(data=[...]) with no pagination meta.
  async getBranches(): Promise<ApiResponse<Branch[]>> {
    const res = await this.client.get<ApiResponse<Branch[]>>("/branches");
    return res.data;
  }

  async getBranch(id: string): Promise<ApiResponse<Branch>> {
    const res = await this.client.get<ApiResponse<Branch>>(`/branches/${id}`);
    return res.data;
  }

  // ---- Membership Plans ----
  // Backend returns success_response(data=[...]) with no pagination meta.
  async getMembershipPlans(): Promise<ApiResponse<MembershipPlan[]>> {
    const res = await this.client.get<ApiResponse<MembershipPlan[]>>("/membership-plans");
    return res.data;
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

  // ---- Memberships ----
  async getMemberships(params?: Record<string, unknown>): Promise<PaginatedResponse<Membership>> {
    const res = await this.client.get<PaginatedResponse<Membership>>("/memberships", { params });
    return res.data;
  }

  async getMembership(id: string): Promise<ApiResponse<Membership>> {
    const res = await this.client.get<ApiResponse<Membership>>(`/memberships/${id}`);
    return res.data;
  }

  async createMembership(data: Record<string, unknown>): Promise<ApiResponse<Membership>> {
    const res = await this.client.post<ApiResponse<Membership>>("/memberships", data);
    return res.data;
  }

  async freezeMembership(id: string, data: { reason?: string; endDate?: string }): Promise<ApiResponse<Membership>> {
    // Backend MembershipUpdate contract uses freezeReason/freezeEndDate.
    const res = await this.client.post<ApiResponse<Membership>>(`/memberships/${id}/freeze`, {
      freezeReason: data.reason,
      freezeEndDate: data.endDate,
    });
    return res.data;
  }

  async unfreezeMembership(id: string): Promise<ApiResponse<Membership>> {
    const res = await this.client.post<ApiResponse<Membership>>(`/memberships/${id}/unfreeze`);
    return res.data;
  }

  // ---- Training Programs ----
  async getTrainingPrograms(params?: Record<string, unknown>): Promise<PaginatedResponse<TrainingProgram>> {
    const res = await this.client.get<PaginatedResponse<TrainingProgram>>("/training-programs", { params });
    return res.data;
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

  // ---- Exercises ----
  async getExercises(params?: Record<string, unknown>): Promise<PaginatedResponse<Exercise>> {
    const res = await this.client.get<PaginatedResponse<Exercise>>("/exercises", { params });
    return res.data;
  }

  async getExercise(id: string): Promise<ApiResponse<Exercise>> {
    const res = await this.client.get<ApiResponse<Exercise>>(`/exercises/${id}`);
    return res.data;
  }

  async createExercise(data: Record<string, unknown>): Promise<ApiResponse<Exercise>> {
    const res = await this.client.post<ApiResponse<Exercise>>("/exercises", data);
    return res.data;
  }

  // ---- Goals ----
  async getGoals(params?: Record<string, unknown>): Promise<PaginatedResponse<Goal>> {
    const res = await this.client.get<PaginatedResponse<Goal>>("/goals", { params });
    return res.data;
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

  // ---- Check-ins ----
  async checkIn(data: { userId: string; branchId: string }): Promise<ApiResponse<CheckIn>> {
    const res = await this.client.post<ApiResponse<CheckIn>>("/check-ins", data);
    return res.data;
  }

  async checkOut(data: { checkInId: string }): Promise<ApiResponse<CheckIn>> {
    const res = await this.client.post<ApiResponse<CheckIn>>("/check-ins/check-out", data);
    return res.data;
  }

  async qrCheckIn(data: { code: string }): Promise<ApiResponse<QRCheckInResponse>> {
    const res = await this.client.post<ApiResponse<QRCheckInResponse>>("/check-ins/qr/check-in", data);
    return res.data;
  }

  async getCheckIns(params?: Record<string, unknown>): Promise<PaginatedResponse<CheckIn>> {
    const res = await this.client.get<PaginatedResponse<CheckIn>>("/check-ins", { params });
    return res.data;
  }

  // ---- Payments ----
  async getPayments(params?: Record<string, unknown>): Promise<PaginatedResponse<Payment>> {
    const res = await this.client.get<PaginatedResponse<Payment>>("/payments", { params });
    return res.data;
  }

  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    const res = await this.client.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data;
  }

  async createPayment(data: Record<string, unknown>): Promise<ApiResponse<Payment>> {
    const res = await this.client.post<ApiResponse<Payment>>("/payments", data);
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

  // ---- Notifications ----
  async getNotifications(params?: Record<string, unknown>): Promise<PaginatedResponse<Notification>> {
    const res = await this.client.get<PaginatedResponse<Notification>>("/notifications", { params });
    return res.data;
  }

  // Backend returns success_response(message=...) with no `data` key.
  async markNotificationRead(id: string): Promise<ApiResponse<null>> {
    const res = await this.client.post<ApiResponse<null>>(`/notifications/${id}/read`);
    return res.data;
  }

  async markAllNotificationsRead(): Promise<ApiResponse> {
    const res = await this.client.post<ApiResponse>("/notifications/read-all");
    return res.data;
  }
}

export const api = new ApiClient();
export default api;