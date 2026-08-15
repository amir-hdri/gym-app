import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, PaginatedResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
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
  async login(credentials: { email: string; password: string; rememberMe?: boolean }) {
    const res = await this.client.post<ApiResponse>("/auth/login", credentials);
    return res.data;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; phone: string; role: string; branchId?: string }) {
    const res = await this.client.post<ApiResponse>("/auth/register", data);
    return res.data;
  }

  async refreshToken(refreshToken: string) {
    const res = await this.client.post<ApiResponse>("/auth/refresh", { refreshToken });
    return res.data;
  }

  async logout() {
    const res = await this.client.post<ApiResponse>("/auth/logout");
    return res.data;
  }

  async getProfile() {
    const res = await this.client.get<ApiResponse>("/auth/profile");
    return res.data;
  }

  // ---- Users ----
  async getUsers(params?: Record<string, unknown>) {
    const res = await this.client.get("/users", { params });
    return res.data;
  }

  async getUser(id: string) {
    const res = await this.client.get(`/users/${id}`);
    return res.data;
  }

  async createUser(data: Record<string, unknown>) {
    const res = await this.client.post("/users", data);
    return res.data;
  }

  async updateUser(id: string, data: Record<string, unknown>) {
    const res = await this.client.put(`/users/${id}`, data);
    return res.data;
  }

  async deleteUser(id: string) {
    const res = await this.client.delete(`/users/${id}`);
    return res.data;
  }

  // ---- Branches ----
  async getBranches() {
    const res = await this.client.get("/branches");
    return res.data;
  }

  async getBranch(id: string) {
    const res = await this.client.get(`/branches/${id}`);
    return res.data;
  }

  // ---- Membership Plans ----
  async getMembershipPlans() {
    const res = await this.client.get("/membership-plans");
    return res.data;
  }

  async getMembershipPlan(id: string) {
    const res = await this.client.get(`/membership-plans/${id}`);
    return res.data;
  }

  async createMembershipPlan(data: Record<string, unknown>) {
    const res = await this.client.post("/membership-plans", data);
    return res.data;
  }

  async updateMembershipPlan(id: string, data: Record<string, unknown>) {
    const res = await this.client.put(`/membership-plans/${id}`, data);
    return res.data;
  }

  // ---- Memberships ----
  async getMemberships(params?: Record<string, unknown>) {
    const res = await this.client.get("/memberships", { params });
    return res.data;
  }

  async getMembership(id: string) {
    const res = await this.client.get(`/memberships/${id}`);
    return res.data;
  }

  async createMembership(data: Record<string, unknown>) {
    const res = await this.client.post("/memberships", data);
    return res.data;
  }

  async freezeMembership(id: string, data: { reason: string; endDate?: string }) {
    const res = await this.client.post(`/memberships/${id}/freeze`, data);
    return res.data;
  }

  async unfreezeMembership(id: string) {
    const res = await this.client.post(`/memberships/${id}/unfreeze`);
    return res.data;
  }

  // ---- Training Programs ----
  async getTrainingPrograms(params?: Record<string, unknown>) {
    const res = await this.client.get("/training-programs", { params });
    return res.data;
  }

  async getTrainingProgram(id: string) {
    const res = await this.client.get(`/training-programs/${id}`);
    return res.data;
  }

  async createTrainingProgram(data: Record<string, unknown>) {
    const res = await this.client.post("/training-programs", data);
    return res.data;
  }

  async updateTrainingProgram(id: string, data: Record<string, unknown>) {
    const res = await this.client.put(`/training-programs/${id}`, data);
    return res.data;
  }

  async deleteTrainingProgram(id: string) {
    const res = await this.client.delete(`/training-programs/${id}`);
    return res.data;
  }

  async completeProgramExercise(programId: string, exerciseId: string, data: Record<string, unknown>) {
    const res = await this.client.post(`/training-programs/${programId}/exercises/${exerciseId}/complete`, data);
    return res.data;
  }

  // ---- Exercises ----
  async getExercises(params?: Record<string, unknown>) {
    const res = await this.client.get("/exercises", { params });
    return res.data;
  }

  async getExercise(id: string) {
    const res = await this.client.get(`/exercises/${id}`);
    return res.data;
  }

  async createExercise(data: Record<string, unknown>) {
    const res = await this.client.post("/exercises", data);
    return res.data;
  }

  // ---- Goals ----
  async getGoals(params?: Record<string, unknown>) {
    const res = await this.client.get("/goals", { params });
    return res.data;
  }

  async getGoal(id: string) {
    const res = await this.client.get(`/goals/${id}`);
    return res.data;
  }

  async createGoal(data: Record<string, unknown>) {
    const res = await this.client.post("/goals", data);
    return res.data;
  }

  async updateGoalProgress(id: string, currentValue: number) {
    const res = await this.client.post(`/goals/${id}/progress`, { currentValue });
    return res.data;
  }

  // ---- Check-ins ----
  async checkIn(data: { userId: string; branchId: string }) {
    const res = await this.client.post("/check-ins", data);
    return res.data;
  }

  async checkOut(data: { checkInId: string }) {
    const res = await this.client.post("/check-ins/check-out", data);
    return res.data;
  }

  async qrCheckIn(data: { code: string }) {
    const res = await this.client.post("/check-ins/qr/check-in", data);
    return res.data;
  }

  async getCheckIns(params?: Record<string, unknown>) {
    const res = await this.client.get("/check-ins", { params });
    return res.data;
  }

  // ---- Payments ----
  async getPayments(params?: Record<string, unknown>) {
    const res = await this.client.get("/payments", { params });
    return res.data;
  }

  async createPayment(data: Record<string, unknown>) {
    const res = await this.client.post("/payments", data);
    return res.data;
  }

  // ---- Dashboard ----
  async getDashboardStats() {
    const res = await this.client.get("/dashboard/stats");
    return res.data;
  }

  async getAthleteDashboard(athleteId: string) {
    const res = await this.client.get(`/dashboard/athlete/${athleteId}`);
    return res.data;
  }

  async getCoachDashboard(coachId: string) {
    const res = await this.client.get(`/dashboard/coach/${coachId}`);
    return res.data;
  }

  // ---- Notifications ----
  async getNotifications(params?: Record<string, unknown>) {
    const res = await this.client.get("/notifications", { params });
    return res.data;
  }

  async markNotificationRead(id: string) {
    const res = await this.client.post(`/notifications/${id}/read`);
    return res.data;
  }

  async markAllNotificationsRead() {
    const res = await this.client.post("/notifications/read-all");
    return res.data;
  }
}

export const api = new ApiClient();
export default api;