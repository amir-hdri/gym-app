export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export type UserRole = "admin" | "coach" | "athlete" | "receptionist";
export type UserStatus = "active" | "inactive" | "suspended" | "pending_verification";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  sessionsCount: number;
  price: number;
  discountPercent: number;
  features: string[];
  isActive: boolean;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  user?: User;
  planId: string;
  plan?: MembershipPlan;
  branchId: string;
  branch?: Branch;
  startDate: string;
  endDate: string;
  sessionsTotal: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  price: number;
  discountAmount: number;
  finalPrice: number;
  status: "active" | "expired" | "frozen" | "cancelled";
  freezeReason?: string;
  freezeEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  category: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  equipment?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  videoUrl?: string;
  imageUrl?: string;
  instructions?: string;
  tips?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgram {
  id: string;
  athleteId: string;
  athlete?: User;
  coachId: string;
  coach?: User;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  frequencyPerWeek: number;
  status: "draft" | "active" | "completed" | "archived";
  exercises: ProgramExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgramExercise {
  id: string;
  programId: string;
  exerciseId: string;
  exercise?: Exercise;
  dayOfWeek: number;
  order: number;
  sets: number;
  reps: string;
  weight?: number;
  restSeconds: number;
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  actualSets?: number;
  actualReps?: string;
  actualWeight?: number;
}

export interface Goal {
  id: string;
  athleteId: string;
  athlete?: User;
  coachId?: string;
  coach?: User;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: "weight_loss" | "muscle_gain" | "strength" | "endurance" | "flexibility" | "custom";
  startDate: string;
  targetDate: string;
  status: "not_started" | "in_progress" | "achieved" | "missed" | "paused";
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  user?: User;
  branchId: string;
  branch?: Branch;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  sessionDeducted: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  user?: User;
  membershipId?: string;
  membership?: Membership;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  method: "card" | "cash" | "wallet" | "bank_transfer";
  referenceId?: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "reminder";
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalCoaches: number;
  totalRevenue: number;
  monthlyRevenue: number;
  expiringMemberships: number;
  todayCheckIns: number;
  avgSessionDuration: number;
}

export interface AthleteDashboardData {
  currentProgram?: TrainingProgram;
  todayExercises: ProgramExercise[];
  upcomingGoals: Goal[];
  recentCheckIns: CheckIn[];
  membership?: Membership;
  stats: {
    totalSessions: number;
    completedSessions: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export interface CoachDashboardData {
  totalAthletes: number;
  activePrograms: number;
  pendingReviews: number;
  todaySessions: number;
  athletes: {
    id: string;
    name: string;
    avatarUrl?: string;
    currentProgram?: TrainingProgram;
    lastCheckIn?: string;
    progress: number;
  }[];
}