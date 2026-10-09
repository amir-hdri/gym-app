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
/**
 * The four values `PATCH /users/{id}/status` accepts. Anything else comes back
 * as a 400 — this union is the server's allow-list, not a superset of it. (It
 * used to read `pending_verification`, which the server has never accepted.)
 */
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

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

/**
 * The body `POST /memberships` accepts, mirroring the server's
 * `MembershipCreate`. `sessionsRemaining` is absent on purpose: the server
 * derives it from `sessionsTotal - sessionsUsed` on every read, so sending it
 * would be ignored.
 *
 * `price` and `finalPrice` are both required and must be > 0 — the server
 * rejects zero with a 422 rather than treating it as "free".
 */
export interface MembershipInput {
  userId: string;
  planId: string;
  branchId: string;
  startDate: string;
  endDate: string;
  price: number;
  finalPrice: number;
  sessionsTotal?: number;
  sessionsUsed?: number;
  discountAmount?: number;
  status?: Membership["status"];
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

/**
 * The fields a coach may write when building a program's exercise list.
 *
 * Deliberately excludes `isCompleted` and the `actual*` trio: those belong to
 * the athlete's own `…/complete` call, and the create endpoint does not accept
 * them at all — it would drop them silently.
 */
export type ProgramExerciseInput = Partial<
  Pick<
    ProgramExercise,
    "exerciseId" | "dayOfWeek" | "order" | "sets" | "reps" | "weight" | "restSeconds" | "notes"
  >
>;

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
  totalUsers: number;
  activeMembers: number;
  todayCheckins: number;
  activeMemberships: number;
  monthlyRevenue: number;
  // legacy + alias for frontend mock compatibility
  totalMembers?: number;
  totalCoaches?: number;
  totalRevenue?: number;
  expiringMemberships?: number;
  avgSessionDuration?: number;
  todayCheckIns?: number;
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
  athletesCount?: number;
  activePrograms: number;
  pendingReviews: number;
  pendingGoals?: number;
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

// === Messaging (API contract v2 §1) ===

/** The *other* party of a conversation, relative to the caller. */
export interface ConversationParticipant {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string | null;
}

/** Preview of the newest message in a conversation. */
export interface ConversationLastMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  athleteId: string;
  coachId: string;
  participant?: ConversationParticipant;
  lastMessage?: ConversationLastMessage | null;
  unreadCount: number;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * A single message in a conversation.
 *
 * Named `ChatMessage` rather than `Message` on purpose: `Message` is a DOM
 * global (the `postMessage` event type), so a bare `Message` silently resolves
 * to the lib.dom type when an import is missing.
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

// === Analytics (API contract v2 §5) ===

/** One day of gym-wide attendance. `date` is `YYYY-MM-DD`. */
export interface AttendanceTrendPoint {
  date: string;
  checkIns: number;
  uniqueMembers: number;
}

/** One month of revenue. `month` is `YYYY-MM`. */
export interface RevenueTrendPoint {
  month: string;
  revenue: number;
  payments: number;
}

/**
 * Revenue as two parallel arrays of equal length — `labels[i]` describes
 * `values[i]`. Labels are `YYYY-MM-DD` for the daily period and `YYYY-MM` for
 * the monthly one. Shaped for a chart library that takes categories and a
 * series separately; `RevenueTrendPoint[]` is the shape to prefer when the
 * monthly numbers are all that is needed.
 */
export interface RevenueSeries {
  labels: string[];
  values: number[];
}

export interface MembershipDistributionSlice {
  planId: string;
  planName: string;
  count: number;
  revenue: number;
}

/** Check-ins bucketed by hour of day. `hour` is 0–23; all 24 are present. */
export interface PeakHourPoint {
  hour: number;
  checkIns: number;
}

/** One day of a single athlete's activity. `date` is `YYYY-MM-DD`. */
export interface AthleteActivityPoint {
  date: string;
  checkedIn: boolean;
  durationMinutes: number;
  exercisesCompleted: number;
}