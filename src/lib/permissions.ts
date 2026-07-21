export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "TRAINER" | "MEMBER";

export const isManager = (role?: UserRole | string | null) =>
  role === "OWNER" || role === "ADMIN" || role === "MANAGER";

export const isStaff = (role?: UserRole | string | null) =>
  role === "OWNER" || role === "ADMIN" || role === "MANAGER" || role === "TRAINER";
