import type {
  User, Branch, MembershipPlan, Membership, Exercise,
  TrainingProgram, ProgramExercise, Goal, CheckIn,
  Payment, Notification, DashboardStats,
  ChatMessage, AttendanceTrendPoint, RevenueTrendPoint, RevenueSeries,
  PeakHourPoint, AthleteActivityPoint,
} from "./types";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const mockUsers: User[] = [
  { id: "u1", email: "admin@gymapp.ir", firstName: "مدیر", lastName: "سیستم", phone: "09121111111", role: "admin", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", lastLoginAt: "2025-07-20T08:30:00Z" },
  { id: "u2", email: "mohseni@gymapp.ir", firstName: "رضا", lastName: "محسنی", phone: "09122222222", role: "coach", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2024-02-01T00:00:00Z", updatedAt: "2025-06-15T00:00:00Z", lastLoginAt: "2025-07-20T09:00:00Z" },
  { id: "u3", email: "ahmadi@gymapp.ir", firstName: "سارا", lastName: "احمدی", phone: "09123333333", role: "coach", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2024-03-01T00:00:00Z", updatedAt: "2025-05-10T00:00:00Z", lastLoginAt: "2025-07-19T14:00:00Z" },
  { id: "u4", email: "karimi@gymapp.ir", firstName: "امیر", lastName: "کریمی", phone: "09124444444", role: "coach", status: "active", avatarUrl: "", branchId: "b2", branchName: "باشگاه غرب", createdAt: "2024-04-01T00:00:00Z", updatedAt: "2025-04-20T00:00:00Z" },
  { id: "u5", email: "mohammadi@gymapp.ir", firstName: "علی", lastName: "محمدی", phone: "09125555555", role: "athlete", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2024-05-01T00:00:00Z", updatedAt: "2025-06-20T00:00:00Z" },
  { id: "u6", email: "hoseini@gymapp.ir", firstName: "مریم", lastName: "حسینی", phone: "09126666666", role: "athlete", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2024-06-01T00:00:00Z", updatedAt: "2025-05-15T00:00:00Z" },
  { id: "u7", email: "rezaei@gymapp.ir", firstName: "حسین", lastName: "رضایی", phone: "09127777777", role: "athlete", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2024-07-01T00:00:00Z", updatedAt: "2025-04-10T00:00:00Z" },
  { id: "u8", email: "moradi@gymapp.ir", firstName: "زهرا", lastName: "مرادی", phone: "09128888888", role: "athlete", status: "active", avatarUrl: "", branchId: "b2", branchName: "باشگاه غرب", createdAt: "2024-08-01T00:00:00Z", updatedAt: "2025-03-05T00:00:00Z" },
  { id: "u9", email: "nazari@gymapp.ir", firstName: "کیان", lastName: "نظری", phone: "09129999999", role: "athlete", status: "inactive", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2024-09-01T00:00:00Z", updatedAt: "2025-02-01T00:00:00Z" },
  { id: "u10", email: "jalali@gymapp.ir", firstName: "نرگس", lastName: "جلالی", phone: "09120000000", role: "athlete", status: "active", avatarUrl: "", branchId: "b2", branchName: "باشگاه غرب", createdAt: "2024-10-01T00:00:00Z", updatedAt: "2025-06-25T00:00:00Z" },
  { id: "u11", email: "sadeghi@gymapp.ir", firstName: "پدرام", lastName: "صادقی", phone: "09121112222", role: "athlete", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2025-01-15T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
  { id: "u12", email: "ghasemi@gymapp.ir", firstName: "الناز", lastName: "قاسمی", phone: "09122223333", role: "athlete", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2025-02-10T00:00:00Z", updatedAt: "2025-05-20T00:00:00Z" },
  { id: "u13", email: "mousavi@gymapp.ir", firstName: "فرهاد", lastName: "موسوی", phone: "09123334444", role: "athlete", status: "suspended", avatarUrl: "", branchId: "b2", branchName: "باشگاه غرب", createdAt: "2024-11-01T00:00:00Z", updatedAt: "2025-03-01T00:00:00Z" },
  { id: "u14", email: "reception@gymapp.ir", firstName: "پذیرش", lastName: "باشگاه", phone: "09124445555", role: "receptionist", status: "active", avatarUrl: "", branchId: "b1", branchName: "Lumi Wellness", createdAt: "2025-03-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
];

export const mockAthletes: User[] = mockUsers.filter(u => u.role === "athlete");

export const mockBranches: Branch[] = [
  { id: "b1", name: "Lumi Wellness", address: "همدان- سعیدیه", phone: "021-12345678", email: "central@gymapp.ir", managerId: "u1", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "b2", name: "باشگاه غرب", address: "تهران، سعادت‌آباد، بلوار سرو", phone: "021-87654321", email: "west@gymapp.ir", managerId: "u4", isActive: true, createdAt: "2024-06-01T00:00:00Z", updatedAt: "2025-03-01T00:00:00Z" },
];

export const mockPlans: MembershipPlan[] = [
  { id: "p1", name: "ماهیانه نقره‌ای", description: "دسترسی به باشگاه در ساعات عادی", durationDays: 30, sessionsCount: 20, price: 500000, discountPercent: 0, features: ["دسترسی به تمام دستگاه‌ها", "کمد شخصی", "برنامه تمرینی ماهانه"], isActive: true, branchId: "b1", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "p2", name: "سه ماهه طلایی", description: "بهترین گزینه برای پیگیری منظم", durationDays: 90, sessionsCount: 60, price: 1200000, discountPercent: 10, features: ["دسترسی تمام وقت", "کمد شخصی", "مربی اختصاصی", "برنامه تغذیه"], isActive: true, branchId: "b1", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "p3", name: "پلاتینیوم", description: "کاملترین پکیج با تمام امکانات", durationDays: 365, sessionsCount: 365, price: 4800000, discountPercent: 15, features: ["دسترسی نامحدود", "مربی خصوصی", "برنامه تغذیه اختصاصی", "ماساژ هفتگی", "اولویت رزرو کلاس"], isActive: true, branchId: "b1", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "p4", name: "دانشجویی", description: "برای دانشجویان عزیز با تخفیف ویژه", durationDays: 30, sessionsCount: 15, price: 300000, discountPercent: 0, features: ["دسترسی ساعات صبح", "برنامه تمرینی"], isActive: true, branchId: "b2", createdAt: "2024-06-01T00:00:00Z", updatedAt: "2025-03-01T00:00:00Z" },
  { id: "p5", name: "ماهیانه برنز", description: "دسترسی پایه به باشگاه", durationDays: 30, sessionsCount: 10, price: 350000, discountPercent: 0, features: ["دسترسی به دستگاه‌ها"], isActive: false, branchId: "b1", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
];

export const mockExercises: Exercise[] = [
  { id: "e1", name: "پرس سینه هالتر", category: "قدرتی", muscleGroup: "سینه", difficulty: "intermediate", equipment: "هالتر", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e2", name: "اسکوات", category: "قدرتی", muscleGroup: "پا", difficulty: "intermediate", equipment: "هالتر", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e3", name: "کشش لت", category: "قدرتی", muscleGroup: "پشت", difficulty: "beginner", equipment: "دستگاه", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e4", name: "پرس شانه دمبل", category: "قدرتی", muscleGroup: "شانه", difficulty: "intermediate", equipment: "دمبل", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e5", name: "جلوبازو هالتر", category: "قدرتی", muscleGroup: "جلو بازو", difficulty: "beginner", equipment: "هالتر", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e6", name: "پشت بازو سیمکش", category: "قدرتی", muscleGroup: "پشت بازو", difficulty: "beginner", equipment: "سیمکش", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e7", name: "ددلیفت", category: "قدرتی", muscleGroup: "پشت", difficulty: "advanced", equipment: "هالتر", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e8", name: "بارفیکس", category: "قدرتی", muscleGroup: "پشت", difficulty: "intermediate", equipment: "بدون دستگاه", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e9", name: "پرس پا", category: "قدرتی", muscleGroup: "پا", difficulty: "beginner", equipment: "دستگاه", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e10", name: "نشر از جانب دمبل", category: "قدرتی", muscleGroup: "شانه", difficulty: "beginner", equipment: "دمبل", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e11", name: "کرانچ", category: "هوازی", muscleGroup: "شکم", difficulty: "beginner", equipment: "بدون دستگاه", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e12", name: "پلانک", category: "هوازی", muscleGroup: "شکم", difficulty: "beginner", equipment: "بدون دستگاه", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e13", name: "پرس بالا سینه دمبل", category: "قدرتی", muscleGroup: "سینه", difficulty: "intermediate", equipment: "دمبل", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e14", name: "قایقی", category: "قدرتی", muscleGroup: "پشت", difficulty: "beginner", equipment: "سیمکش", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
  { id: "e15", name: "لانگز", category: "قدرتی", muscleGroup: "پا", difficulty: "beginner", equipment: "دمبل", isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
];

export const mockMemberships: Membership[] = [
  { id: "m1", userId: "u5", planId: "p2", branchId: "b1", startDate: "2025-04-01T00:00:00Z", endDate: "2025-06-30T00:00:00Z", sessionsTotal: 60, sessionsUsed: 22, sessionsRemaining: 38, price: 1200000, discountAmount: 0, finalPrice: 1200000, status: "active", createdAt: "2025-04-01T00:00:00Z", updatedAt: "2025-07-20T00:00:00Z" },
  { id: "m2", userId: "u6", planId: "p3", branchId: "b1", startDate: "2025-01-01T00:00:00Z", endDate: "2025-12-31T00:00:00Z", sessionsTotal: 365, sessionsUsed: 145, sessionsRemaining: 220, price: 4800000, discountAmount: 0, finalPrice: 4800000, status: "active", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-07-20T00:00:00Z" },
  { id: "m3", userId: "u7", planId: "p1", branchId: "b1", startDate: "2025-07-01T00:00:00Z", endDate: "2025-07-31T00:00:00Z", sessionsTotal: 20, sessionsUsed: 5, sessionsRemaining: 15, price: 500000, discountAmount: 0, finalPrice: 500000, status: "active", createdAt: "2025-07-01T00:00:00Z", updatedAt: "2025-07-20T00:00:00Z" },
  { id: "m4", userId: "u8", planId: "p4", branchId: "b2", startDate: "2025-06-01T00:00:00Z", endDate: "2025-09-30T00:00:00Z", sessionsTotal: 45, sessionsUsed: 20, sessionsRemaining: 25, price: 900000, discountAmount: 0, finalPrice: 900000, status: "active", createdAt: "2025-06-01T00:00:00Z", updatedAt: "2025-07-19T00:00:00Z" },
  { id: "m5", userId: "u10", planId: "p2", branchId: "b2", startDate: "2025-05-01T00:00:00Z", endDate: "2025-07-31T00:00:00Z", sessionsTotal: 60, sessionsUsed: 50, sessionsRemaining: 10, price: 1200000, discountAmount: 120000, finalPrice: 1080000, status: "active", createdAt: "2025-05-01T00:00:00Z", updatedAt: "2025-07-18T00:00:00Z" },
  { id: "m6", userId: "u11", planId: "p1", branchId: "b1", startDate: "2025-07-01T00:00:00Z", endDate: "2025-07-31T00:00:00Z", sessionsTotal: 20, sessionsUsed: 18, sessionsRemaining: 2, price: 500000, discountAmount: 0, finalPrice: 500000, status: "active", createdAt: "2025-07-01T00:00:00Z", updatedAt: "2025-07-20T00:00:00Z" },
  { id: "m7", userId: "u12", planId: "p2", branchId: "b1", startDate: "2025-03-01T00:00:00Z", endDate: "2025-05-31T00:00:00Z", sessionsTotal: 60, sessionsUsed: 60, sessionsRemaining: 0, price: 1200000, discountAmount: 0, finalPrice: 1200000, status: "expired", createdAt: "2025-03-01T00:00:00Z", updatedAt: "2025-05-31T00:00:00Z" },
  { id: "m8", userId: "u9", planId: "p5", branchId: "b1", startDate: "2024-12-01T00:00:00Z", endDate: "2024-12-31T00:00:00Z", sessionsTotal: 10, sessionsUsed: 3, sessionsRemaining: 7, price: 350000, discountAmount: 0, finalPrice: 350000, status: "expired", createdAt: "2024-12-01T00:00:00Z", updatedAt: "2024-12-31T00:00:00Z" },
  { id: "m9", userId: "u13", planId: "p2", branchId: "b2", startDate: "2025-01-01T00:00:00Z", endDate: "2025-03-31T00:00:00Z", sessionsTotal: 60, sessionsUsed: 12, sessionsRemaining: 48, price: 1200000, discountAmount: 0, finalPrice: 1200000, status: "frozen", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-03-01T00:00:00Z", freezeReason: "سفر خارج از کشور", freezeEndDate: "2025-09-01T00:00:00Z" },
];

export const mockGoals: Goal[] = [
  { id: "g1", athleteId: "u5", coachId: "u2", title: "کاهش وزن به ۸۰ کیلو", targetValue: 80, currentValue: 88, unit: "کیلوگرم", category: "weight_loss", startDate: "2025-05-01T00:00:00Z", targetDate: "2025-10-01T00:00:00Z", status: "in_progress", progressPercentage: 35, createdAt: "2025-05-01T00:00:00Z", updatedAt: "2025-07-15T00:00:00Z" },
  { id: "g2", athleteId: "u5", coachId: "u2", title: "افزایش پرس سینه به ۱۰۰ کیلو", targetValue: 100, currentValue: 80, unit: "کیلوگرم", category: "strength", startDate: "2025-04-01T00:00:00Z", targetDate: "2025-08-01T00:00:00Z", status: "in_progress", progressPercentage: 50, createdAt: "2025-04-01T00:00:00Z", updatedAt: "2025-07-10T00:00:00Z" },
  { id: "g3", athleteId: "u5", coachId: "u2", title: "افزایش حجم عضلات سینه", targetValue: 5, currentValue: 0, unit: "سانتی‌متر", category: "muscle_gain", startDate: "2025-06-01T00:00:00Z", targetDate: "2025-12-01T00:00:00Z", status: "not_started", progressPercentage: 0, createdAt: "2025-06-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
  { id: "g4", athleteId: "u6", coachId: "u3", title: "رسیدن به استقامت دو ۵ کیلومتر", targetValue: 5, currentValue: 3, unit: "کیلومتر", category: "endurance", startDate: "2025-05-15T00:00:00Z", targetDate: "2025-09-15T00:00:00Z", status: "in_progress", progressPercentage: 60, createdAt: "2025-05-15T00:00:00Z", updatedAt: "2025-07-18T00:00:00Z" },
  { id: "g5", athleteId: "u7", coachId: "u2", title: "رسیدن به وزن ایده‌آل", targetValue: 75, currentValue: 75, unit: "کیلوگرم", category: "weight_loss", startDate: "2025-01-01T00:00:00Z", targetDate: "2025-06-01T00:00:00Z", status: "achieved", progressPercentage: 100, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-06-01T00:00:00Z" },
  { id: "g6", athleteId: "u10", coachId: "u4", title: "افزایش ددلیفت به ۱۵۰ کیلو", targetValue: 150, currentValue: 100, unit: "کیلوگرم", category: "strength", startDate: "2025-06-01T00:00:00Z", targetDate: "2025-11-01T00:00:00Z", status: "in_progress", progressPercentage: 25, createdAt: "2025-06-01T00:00:00Z", updatedAt: "2025-07-10T00:00:00Z" },
];

export const mockCheckIns: CheckIn[] = [
  { id: "c1", userId: "u5", branchId: "b1", checkInTime: "2025-07-20T07:30:00Z", checkOutTime: "2025-07-20T09:15:00Z", durationMinutes: 105, sessionDeducted: true, createdAt: "2025-07-20T07:30:00Z" },
  { id: "c2", userId: "u6", branchId: "b1", checkInTime: "2025-07-20T08:00:00Z", checkOutTime: "2025-07-20T09:45:00Z", durationMinutes: 105, sessionDeducted: true, createdAt: "2025-07-20T08:00:00Z" },
  { id: "c3", userId: "u7", branchId: "b1", checkInTime: "2025-07-20T06:45:00Z", checkOutTime: "2025-07-20T08:00:00Z", durationMinutes: 75, sessionDeducted: true, createdAt: "2025-07-20T06:45:00Z" },
  { id: "c4", userId: "u5", branchId: "b1", checkInTime: "2025-07-19T07:30:00Z", checkOutTime: "2025-07-19T09:00:00Z", durationMinutes: 90, sessionDeducted: true, createdAt: "2025-07-19T07:30:00Z" },
  { id: "c5", userId: "u8", branchId: "b2", checkInTime: "2025-07-19T10:00:00Z", checkOutTime: "2025-07-19T11:30:00Z", durationMinutes: 90, sessionDeducted: true, createdAt: "2025-07-19T10:00:00Z" },
  { id: "c6", userId: "u5", branchId: "b1", checkInTime: "2025-07-18T07:00:00Z", checkOutTime: "2025-07-18T08:45:00Z", durationMinutes: 105, sessionDeducted: true, createdAt: "2025-07-18T07:00:00Z" },
];

export const mockPayments: Payment[] = [
  { id: "pay1", userId: "u5", membershipId: "m1", amount: 1200000, currency: "ریال", status: "completed", method: "card", referenceId: "REF-001", paidAt: "2025-04-01T10:00:00Z", createdAt: "2025-04-01T10:00:00Z", updatedAt: "2025-04-01T10:00:00Z" },
  { id: "pay2", userId: "u6", membershipId: "m2", amount: 4800000, currency: "ریال", status: "completed", method: "card", referenceId: "REF-002", paidAt: "2025-01-01T10:00:00Z", createdAt: "2025-01-01T10:00:00Z", updatedAt: "2025-01-01T10:00:00Z" },
  { id: "pay3", userId: "u7", membershipId: "m3", amount: 500000, currency: "ریال", status: "completed", method: "cash", referenceId: "REF-003", paidAt: "2025-07-01T10:00:00Z", createdAt: "2025-07-01T10:00:00Z", updatedAt: "2025-07-01T10:00:00Z" },
  { id: "pay4", userId: "u8", membershipId: "m4", amount: 900000, currency: "ریال", status: "completed", method: "wallet", referenceId: "REF-004", paidAt: "2025-06-01T10:00:00Z", createdAt: "2025-06-01T10:00:00Z", updatedAt: "2025-06-01T10:00:00Z" },
  { id: "pay5", userId: "u10", membershipId: "m5", amount: 1080000, currency: "ریال", status: "completed", method: "card", referenceId: "REF-005", paidAt: "2025-05-01T10:00:00Z", createdAt: "2025-05-01T10:00:00Z", updatedAt: "2025-05-01T10:00:00Z" },
  { id: "pay6", userId: "u11", membershipId: "m6", amount: 500000, currency: "ریال", status: "pending", method: "cash", paidAt: undefined, createdAt: "2025-07-19T10:00:00Z", updatedAt: "2025-07-19T10:00:00Z" },
  { id: "pay7", userId: "u12", membershipId: "m7", amount: 1200000, currency: "ریال", status: "completed", method: "card", referenceId: "REF-007", paidAt: "2025-03-01T10:00:00Z", createdAt: "2025-03-01T10:00:00Z", updatedAt: "2025-03-01T10:00:00Z" },
  { id: "pay8", userId: "u13", membershipId: "m9", amount: 1200000, currency: "ریال", status: "refunded", method: "bank_transfer", referenceId: "REF-008", paidAt: "2025-01-01T10:00:00Z", createdAt: "2025-01-01T10:00:00Z", updatedAt: "2025-06-01T10:00:00Z" },
];

export function createMockNotifications(userId: string): Notification[] {
  return [
    { id: "n1", userId, title: "تمرین امروز", message: "شما یک جلسه تمرینی برای امروز ثبت شده است", type: "info", isRead: false, actionUrl: "/athlete/programs", createdAt: "2025-07-20T06:00:00Z" },
    { id: "n2", userId, title: "تمدید اشتراک", message: "اشتراک شما ۷ روز دیگر منقضی می‌شود", type: "warning", isRead: false, actionUrl: "/athlete/membership", createdAt: "2025-07-19T10:00:00Z" },
    { id: "n3", userId, title: "تبریک", message: "شما به رکورد جدیدی در پرس سینه دست یافتید!", type: "success", isRead: true, createdAt: "2025-07-18T11:30:00Z" },
    { id: "n4", userId, title: "به‌روزرسانی برنامه", message: "مربی شما برنامه تمرینیتان را به‌روز کرد", type: "info", isRead: false, createdAt: "2025-07-17T14:00:00Z" },
    { id: "n5", userId, title: "یادآوری پرداخت", message: "صورتحساب ماهیانه شما آماده پرداخت است", type: "reminder", isRead: true, actionUrl: "/athlete/membership", createdAt: "2025-07-15T09:00:00Z" },
  ];
}

export const mockNotifications: Record<string, Notification[]> = {
  u5: createMockNotifications("u5"),
  u6: createMockNotifications("u6"),
  u1: [
    { id: "n10", userId: "u1", title: "عضویت جدید", message: "یک عضو جدید در باشگاه ثبت نام کرد", type: "info", isRead: false, createdAt: "2025-07-20T08:00:00Z" },
    { id: "n11", userId: "u1", title: "تمدید خودکار", message: "۳ اشتراک امروز تمدید خودکار شدند", type: "success", isRead: false, createdAt: "2025-07-20T06:00:00Z" },
    { id: "n12", userId: "u1", title: "گزارش هفتگی", message: "گزارش عملکرد هفتگی باشگاه آماده است", type: "info", isRead: true, createdAt: "2025-07-19T12:00:00Z" },
  ],
  u2: createMockNotifications("u2"),
};

export function createMockPrograms(): TrainingProgram[] {
  const pe = (id: string, progId: string, day: number, order: number, eId: string, comp = false): ProgramExercise => ({
    id, programId: progId, exerciseId: eId,
    exercise: mockExercises.find(ex => ex.id === eId),
    dayOfWeek: day, order, sets: 4, reps: "10-12", weight: 60,
    restSeconds: 90, notes: "", isCompleted: comp,
  });

  return [
    {
      id: "tp1", athleteId: "u5", coachId: "u2", name: "برنامه حجیم‌سازی",
      description: "برنامه ۱۲ هفته‌ای حجیم‌سازی با تمرکز بر عضلات اصلی",
      startDate: "2025-06-01T00:00:00Z", endDate: "2025-08-23T00:00:00Z", frequencyPerWeek: 4,
      status: "active",
      exercises: [
        pe("pe1","tp1",1,1,"e1",true), pe("pe2","tp1",1,2,"e13",true),
        pe("pe3","tp1",1,3,"e10",true), pe("pe4","tp1",1,4,"e6"),
        pe("pe5","tp1",2,1,"e7",true), pe("pe6","tp1",2,2,"e8"),
        pe("pe7","tp1",2,3,"e14"), pe("pe8","tp1",2,4,"e5"),
        pe("pe9","tp1",3,1,"e2",true), pe("pe10","tp1",3,2,"e9",true),
        pe("pe11","tp1",3,3,"e15"), pe("pe12","tp1",4,1,"e1"),
        pe("pe13","tp1",4,2,"e7"), pe("pe14","tp1",4,3,"e11"),
        pe("pe15","tp1",4,4,"e12"),
      ],
      createdAt: "2025-05-25T00:00:00Z", updatedAt: "2025-07-15T00:00:00Z",
    },
    {
      id: "tp2", athleteId: "u6", coachId: "u3", name: "برنامه افزایش استقامت",
      description: "تمرینات هوازی و قدرتی برای افزایش استقامت",
      startDate: "2025-05-15T00:00:00Z", endDate: "2025-08-15T00:00:00Z", frequencyPerWeek: 5,
      status: "active",
      exercises: [
        pe("pe30","tp2",1,1,"e11"), pe("pe31","tp2",1,2,"e12"),
        pe("pe32","tp2",2,1,"e2"), pe("pe33","tp2",2,2,"e15"),
        pe("pe34","tp2",3,1,"e4"), pe("pe35","tp2",3,2,"e10"),
        pe("pe36","tp2",4,1,"e1"), pe("pe37","tp2",4,2,"e6"),
        pe("pe38","tp2",5,1,"e7"), pe("pe39","tp2",5,2,"e14"),
      ],
      createdAt: "2025-05-10T00:00:00Z", updatedAt: "2025-07-10T00:00:00Z",
    },
    {
      id: "tp3", athleteId: "u7", coachId: "u2", name: "برنامه کاهش وزن",
      description: "ترکیب تمرینات هوازی و قدرتی برای سوزاندن چربی",
      startDate: "2025-07-01T00:00:00Z", endDate: "2025-09-30T00:00:00Z", frequencyPerWeek: 3,
      status: "active",
      exercises: [
        { id: "pe50", programId: "tp3", exerciseId: "e2", exercise: mockExercises[1], dayOfWeek: 1, order: 1, sets: 3, reps: "15", weight: 40, restSeconds: 60, notes: "", isCompleted: false },
        { id: "pe51", programId: "tp3", exerciseId: "e9", exercise: mockExercises[8], dayOfWeek: 1, order: 2, sets: 3, reps: "15", restSeconds: 60, notes: "", isCompleted: false },
        { id: "pe52", programId: "tp3", exerciseId: "e11", exercise: mockExercises[10], dayOfWeek: 2, order: 1, sets: 3, reps: "20", restSeconds: 45, notes: "", isCompleted: false },
        { id: "pe53", programId: "tp3", exerciseId: "e12", exercise: mockExercises[11], dayOfWeek: 2, order: 2, sets: 3, reps: "45s", restSeconds: 30, notes: "", isCompleted: false },
        { id: "pe54", programId: "tp3", exerciseId: "e1", exercise: mockExercises[0], dayOfWeek: 3, order: 1, sets: 3, reps: "12", weight: 30, restSeconds: 60, notes: "", isCompleted: false },
      ],
      createdAt: "2025-06-25T00:00:00Z", updatedAt: "2025-07-01T00:00:00Z",
    },
  ];
}

export const mockDashboardStats: DashboardStats = {
  totalUsers: 12,
  totalMembers: 8,
  activeMembers: 7,
  activeMemberships: 6,
  totalCoaches: 3,
  totalRevenue: 10800000,
  monthlyRevenue: 3200000,
  expiringMemberships: 3,
  todayCheckIns: 4,
  todayCheckins: 4,
  avgSessionDuration: 90,
};

/**
 * Training programs are a *store*, not a factory result: completing an exercise
 * has to stick for the rest of the session so the offline demo behaves like the
 * real API. `createMockPrograms()` stays exported for anyone who wants a
 * pristine copy.
 */
let programStore: TrainingProgram[] | null = null;

export function getMockPrograms(): TrainingProgram[] {
  programStore ??= createMockPrograms();
  return programStore;
}

// ===========================================================================
// Deterministic pseudo-random helpers
// ===========================================================================
// Analytics series must not jitter between refetches, so every value is a pure
// function of a string key (usually the date). Keying on the absolute date —
// rather than the index within the window — also means a 30-day and a 90-day
// request agree on the days they share.

function hashKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable value in [0, 1) for a given key (mulberry32, one draw). */
function seededUnit(key: string): number {
  const a = (hashKey(key) + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Stable multiplier in [1 - spread, 1 + spread). */
function jitter(key: string, spread: number): number {
  return 1 + (seededUnit(key) * 2 - 1) * spread;
}

/** Local-time `YYYY-MM-DD` (never UTC — that shifts the day in Tehran). */
function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Local-time `YYYY-MM`. */
function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ===========================================================================
// Analytics series (API contract v2 §5)
// ===========================================================================

/**
 * Attendance by weekday, using the Iranian working week: Saturday–Wednesday are
 * full days, Thursday tapers off and Friday is the weekend. Indexed by
 * `Date#getDay()` (0 = Sunday).
 */
const ATTENDANCE_BY_WEEKDAY: readonly number[] = [
  46, // Sunday    یکشنبه
  49, // Monday    دوشنبه
  44, // Tuesday   سه‌شنبه
  47, // Wednesday چهارشنبه
  29, // Thursday  پنجشنبه — weekend begins
  13, // Friday    جمعه    — weekend
  42, // Saturday  شنبه    — first day of the week
];

/** Check-ins per hour over a 30-day window: morning bump, evening peak at 18. */
const CHECK_INS_BY_HOUR: readonly number[] = [
  0, 0, 0, 0, 0, 1, // 00–05 closed
  12, 24, 28, // 06–08 before work
  17, 11, 9, // 09–11
  8, 8, 10, // 12–14
  15, 28, 42, // 15–17 ramping up
  58, 54, 40, // 18–20 evening peak
  26, 12, 3, // 21–23
];

/** Dense, ascending, ending today. Missing days are impossible by construction. */
export function createAttendanceTrend(days = 30): AttendanceTrendPoint[] {
  const span = clamp(Math.round(days), 1, 365);
  const today = startOfDay(new Date());
  const points: AttendanceTrendPoint[] = [];

  for (let daysAgo = span - 1; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const key = toDateKey(date);
    // The club is growing: older days sit a little lower than today.
    const growth = 1 - 0.25 * (daysAgo / 180);
    const base = ATTENDANCE_BY_WEEKDAY[date.getDay()] * growth;
    const checkIns = Math.max(0, Math.round(base * jitter(`attendance:${key}`, 0.18)));
    // Some members train twice a day, so unique members trail check-ins.
    const uniqueMembers = Math.round(checkIns * (0.74 + seededUnit(`unique:${key}`) * 0.12));
    points.push({ date: key, checkIns, uniqueMembers: Math.min(checkIns, uniqueMembers) });
  }

  return points;
}

/** Dense, ascending, ending with the current month. */
export function createRevenueTrend(months = 6): RevenueTrendPoint[] {
  const span = clamp(Math.round(months), 1, 24);
  const now = new Date();
  const points: RevenueTrendPoint[] = [];

  for (let monthsAgo = span - 1; monthsAgo >= 0; monthsAgo -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const key = toMonthKey(date);
    // ~6% month-over-month ramp up to the present month.
    const base = 42_000_000 * Math.pow(0.94, monthsAgo);
    const revenue = Math.round((base * jitter(`revenue:${key}`, 0.12)) / 100_000) * 100_000;
    const payments = Math.max(1, Math.round((revenue / 1_150_000) * jitter(`payments:${key}`, 0.1)));
    points.push({ month: key, revenue, payments });
  }

  return points;
}

/**
 * The `{ labels, values }` form of the same revenue numbers.
 *
 * The monthly branch delegates to `createRevenueTrend` rather than
 * recomputing: two mock endpoints reporting different totals for one month
 * would be a bug the real API cannot have, since both read the same payments
 * table there.
 *
 * The daily branch is the server's 30-day window — a fixed span, which is why
 * `days` is not a parameter.
 */
export function createRevenueSeries(
  period: "daily" | "monthly" = "monthly",
  months = 6,
): RevenueSeries {
  if (period === "monthly") {
    const points = createRevenueTrend(months);
    return { labels: points.map((p) => p.month), values: points.map((p) => p.revenue) };
  }

  const today = startOfDay(new Date());
  const labels: string[] = [];
  const values: number[] = [];

  for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const key = toDateKey(date);
    labels.push(key);
    // Daily takings track attendance: busy weekdays sell more sessions.
    const base = ATTENDANCE_BY_WEEKDAY[date.getDay()] * 95_000;
    values.push(Math.round((base * jitter(`daily-revenue:${key}`, 0.3)) / 10_000) * 10_000);
  }

  return { labels, values };
}

/** All 24 hours, ascending, scaled to the requested window. */
export function createPeakHours(days = 30): PeakHourPoint[] {
  const span = clamp(Math.round(days), 1, 365);
  const scale = span / 30;

  return CHECK_INS_BY_HOUR.map((weight, hour) => ({
    hour,
    checkIns: weight === 0 ? 0 : Math.max(0, Math.round(weight * scale * jitter(`peak:${hour}:${span}`, 0.12))),
  }));
}

/** Dense, ascending, ending today. Rest days carry zeroes rather than gaps. */
export function createAthleteActivity(athleteId: string, days = 30): AthleteActivityPoint[] {
  const span = clamp(Math.round(days), 1, 365);
  const today = startOfDay(new Date());
  const points: AthleteActivityPoint[] = [];

  for (let daysAgo = span - 1; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const key = toDateKey(date);
    const isWeekend = date.getDay() === 5; // Friday: the gym is closed.
    // Roughly four sessions a week, and never on the day off.
    const trains = !isWeekend && seededUnit(`activity:${athleteId}:${key}`) < 0.62;
    points.push({
      date: key,
      checkedIn: trains,
      durationMinutes: trains ? 45 + Math.round(seededUnit(`duration:${athleteId}:${key}`) * 50) : 0,
      exercisesCompleted: trains ? 4 + Math.round(seededUnit(`exercises:${athleteId}:${key}`) * 5) : 0,
    });
  }

  return points;
}

// ===========================================================================
// Messaging (API contract v2 §1)
// ===========================================================================

/** The raw conversation row. The per-caller view is derived in `mock-service`. */
export interface MockConversationRow {
  id: string;
  athleteId: string;
  coachId: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

const MESSAGE_EPOCH = Date.now();

function minutesAgo(minutes: number): string {
  return new Date(MESSAGE_EPOCH - minutes * 60_000).toISOString();
}

const DAY_MINUTES = 60 * 24;

export const mockChatMessages: ChatMessage[] = [
  // cv1 — علی محمدی (u5) ↔ مربی رضا محسنی (u2)
  { id: "msg1", conversationId: "cv1", senderId: "u2", body: "سلام علی جان، برنامه این هفته رو برات به‌روز کردم.", readAt: minutesAgo(3 * DAY_MINUTES), createdAt: minutesAgo(3 * DAY_MINUTES + 40) },
  { id: "msg2", conversationId: "cv1", senderId: "u5", body: "سلام استاد، ممنون. حجم تمرین پا زیاد نیست؟", readAt: minutesAgo(3 * DAY_MINUTES - 10), createdAt: minutesAgo(3 * DAY_MINUTES - 25) },
  { id: "msg3", conversationId: "cv1", senderId: "u2", body: "نه، ست آخر رو سبک‌تر بزن. اگر زانو اذیت کرد خبر بده.", readAt: minutesAgo(2 * DAY_MINUTES), createdAt: minutesAgo(2 * DAY_MINUTES + 30) },
  { id: "msg4", conversationId: "cv1", senderId: "u5", body: "چشم. دیروز پرس سینه ۸۰ کیلو رو ۵ تکرار زدم 💪", readAt: minutesAgo(DAY_MINUTES), createdAt: minutesAgo(DAY_MINUTES + 120) },
  { id: "msg5", conversationId: "cv1", senderId: "u2", body: "آفرین! پس هفته بعد می‌ریم روی ۸۵.", readAt: minutesAgo(DAY_MINUTES - 5), createdAt: minutesAgo(DAY_MINUTES - 20) },
  { id: "msg6", conversationId: "cv1", senderId: "u5", body: "عالیه. تغذیه رو هم باید تغییر بدم؟", readAt: minutesAgo(600), createdAt: minutesAgo(620) },
  // The two newest are unread for the athlete (readAt: null).
  { id: "msg7", conversationId: "cv1", senderId: "u2", body: "پروتئین رو ببر روی ۱۶۰ گرم در روز و کربوهیدرات قبل تمرین رو بیشتر کن.", readAt: null, createdAt: minutesAgo(95) },
  { id: "msg8", conversationId: "cv1", senderId: "u2", body: "فردا ساعت ۱۸ باشگاه هستم، بیا یه بار فرم ددلیفتت رو ببینم.", readAt: null, createdAt: minutesAgo(42) },

  // cv2 — مریم حسینی (u6) ↔ مربی سارا احمدی (u3)
  { id: "msg20", conversationId: "cv2", senderId: "u6", body: "سلام سارا جان، برنامه هوازی این ماه رو شروع کردم.", readAt: minutesAgo(5 * DAY_MINUTES), createdAt: minutesAgo(5 * DAY_MINUTES + 15) },
  { id: "msg21", conversationId: "cv2", senderId: "u3", body: "سلام مریم، عالیه. ضربان قلبت رو موقع دویدن چک کن.", readAt: minutesAgo(4 * DAY_MINUTES), createdAt: minutesAgo(4 * DAY_MINUTES + 50) },
  { id: "msg22", conversationId: "cv2", senderId: "u6", body: "امروز ۳ کیلومتر رو بدون توقف دویدم!", readAt: minutesAgo(200), createdAt: minutesAgo(240) },
  { id: "msg23", conversationId: "cv2", senderId: "u3", body: "چه خبر خوبی! هدف ۵ کیلومتر نزدیکه.", readAt: null, createdAt: minutesAgo(180) },

  // cv3 — حسین رضایی (u7) ↔ مربی رضا محسنی (u2)
  { id: "msg40", conversationId: "cv3", senderId: "u7", body: "سلام، برای جلسه جبرانی این هفته وقت دارید؟", readAt: minutesAgo(8 * DAY_MINUTES), createdAt: minutesAgo(8 * DAY_MINUTES + 20) },
  { id: "msg41", conversationId: "cv3", senderId: "u2", body: "سلام حسین، پنجشنبه صبح آزادم.", readAt: minutesAgo(7 * DAY_MINUTES), createdAt: minutesAgo(7 * DAY_MINUTES + 10) },
  { id: "msg42", conversationId: "cv3", senderId: "u7", body: "ممنون، پنجشنبه ساعت ۹ میام.", readAt: minutesAgo(6 * DAY_MINUTES), createdAt: minutesAgo(6 * DAY_MINUTES + 30) },
];

function lastMessageAtOf(conversationId: string, fallback: string): string {
  const times = mockChatMessages.filter((m) => m.conversationId === conversationId).map((m) => m.createdAt);
  return times.length ? times.reduce((latest, t) => (t > latest ? t : latest)) : fallback;
}

export const mockConversationRows: MockConversationRow[] = [
  {
    id: "cv1", athleteId: "u5", coachId: "u2",
    createdAt: minutesAgo(30 * DAY_MINUTES),
    lastMessageAt: lastMessageAtOf("cv1", minutesAgo(30 * DAY_MINUTES)),
    updatedAt: lastMessageAtOf("cv1", minutesAgo(30 * DAY_MINUTES)),
  },
  {
    id: "cv2", athleteId: "u6", coachId: "u3",
    createdAt: minutesAgo(45 * DAY_MINUTES),
    lastMessageAt: lastMessageAtOf("cv2", minutesAgo(45 * DAY_MINUTES)),
    updatedAt: lastMessageAtOf("cv2", minutesAgo(45 * DAY_MINUTES)),
  },
  {
    id: "cv3", athleteId: "u7", coachId: "u2",
    createdAt: minutesAgo(20 * DAY_MINUTES),
    lastMessageAt: lastMessageAtOf("cv3", minutesAgo(20 * DAY_MINUTES)),
    updatedAt: lastMessageAtOf("cv3", minutesAgo(20 * DAY_MINUTES)),
  },
];

// ===========================================================================
// Password reset / change (API contract v2 §2)
// ===========================================================================

/** Every seeded mock user signs in with this. */
export const DEFAULT_MOCK_PASSWORD = "Lumi1234";

/** userId → current password. Unlisted users still have the default. */
export const mockPasswords: Record<string, string> = {};

export interface MockResetToken {
  token: string;
  userId: string;
  expiresAt: string;
  usedAt?: string;
}

/** Issued reset tokens. Mirrors the real single-use, 30-minute TTL behaviour. */
export const mockResetTokens: MockResetToken[] = [];
