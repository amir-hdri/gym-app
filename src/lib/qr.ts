import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "gym-app-secret-key-32-chars-long-secure-salt";

export const PERSIAN_DAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const;

export type PersianDayName = typeof PERSIAN_DAYS[number];

/**
 * Converts a JavaScript Date to day-of-week index where Saturday=0 ... Friday=6.
 * JS standard: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6.
 * (6 + 1) % 7 = 0 (Saturday)
 * (0 + 1) % 7 = 1 (Sunday)
 * (1 + 1) % 7 = 2 (Monday)
 * (2 + 1) % 7 = 3 (Tuesday)
 * (3 + 1) % 7 = 4 (Wednesday)
 * (4 + 1) % 7 = 5 (Thursday)
 * (5 + 1) % 7 = 6 (Friday)
 */
export function getTodayDayOfWeek(date: Date = new Date()): number {
  const jsDay = date.getDay();
  return (jsDay + 1) % 7;
}

/**
 * Returns the Persian day name for a 0-indexed day (0=شنبه .. 6=جمعه).
 */
export function getDayNamePersian(dayOfWeek: number): string {
  const normalized = ((dayOfWeek % 7) + 7) % 7;
  return PERSIAN_DAYS[normalized] || "شنبه";
}

/**
 * Generates a secure HMAC-SHA256 rotating QR token with 120s expiration and 30s UI rotation.
 * Format: CODE.TIMESTAMP.TYPE.HMAC.MEMBERID
 */
export function generateSecureQrToken(
  membershipCode: string,
  memberId: string,
  type: string = "ENTRY",
  timestamp: number = Date.now()
): string {
  const cleanCode = membershipCode.trim().toUpperCase();
  const cleanType = type.trim().toUpperCase();
  const cleanMemberId = memberId.trim();
  const payload = `${cleanCode}.${timestamp}.${cleanType}.${cleanMemberId}`;

  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .substring(0, 32); // 32 hex chars for compact QR density

  return `${cleanCode}.${timestamp}.${cleanType}.${hmac}.${cleanMemberId}`;
}

export interface VerifyQrTokenResult {
  valid: boolean;
  membershipCode?: string;
  memberId?: string;
  type?: string;
  isLegacy?: boolean;
  isExpired?: boolean;
  warning?: string;
  error?: string;
  timestamp?: number;
}

/**
 * Verifies a QR token. Accepts both secure rotating tokens (CODE.TIMESTAMP.TYPE.HMAC.MEMBERID)
 * and legacy static membership codes (e.g. MEM-001).
 * If expired (>120s), provides a Persian error message but allows entry with a warning for backward compatibility.
 */
export function verifyQrToken(token: string): VerifyQrTokenResult {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "کد QR ارائه نشده یا نامعتبر است" };
  }

  const trimmed = token.trim();
  const parts = trimmed.split(".");

  // If not formatted with 5 parts (e.g. MEM-001 or plain code), treat as legacy static code
  if (parts.length !== 5) {
    return {
      valid: true,
      membershipCode: trimmed.toUpperCase(),
      isLegacy: true,
      isExpired: false,
      type: "REGULAR",
    };
  }

  const [code, timestampStr, type, hmac, memberId] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp) || !code || !memberId || !hmac) {
    // Malformed token - fallback to code if plausible
    return {
      valid: true,
      membershipCode: code ? code.toUpperCase() : trimmed.toUpperCase(),
      isLegacy: true,
      isExpired: false,
      warning: "فرمت توکن ناقص بود اما به عنوان کد استاتیک پردازش شد",
    };
  }

  // Recalculate HMAC
  const payload = `${code.toUpperCase()}.${timestamp}.${type.toUpperCase()}.${memberId}`;
  const expectedHmac = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex")
    .substring(0, 32);

  const hmacBuffer = Buffer.from(hmac, "hex");
  const expectedBuffer = Buffer.from(expectedHmac, "hex");

  if (
    hmacBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(hmacBuffer, expectedBuffer)
  ) {
    return {
      valid: false,
      error: "امضای دیجیتال کد QR معتبر نیست و دستکاری شده است",
    };
  }

  const now = Date.now();
  const ageMs = now - timestamp;
  const EXPIRATION_WINDOW_MS = 120 * 1000; // 120 seconds

  // Check if token is expired (> 120s)
  if (ageMs > EXPIRATION_WINDOW_MS || ageMs < -30 * 1000) {
    return {
      valid: true,
      membershipCode: code.toUpperCase(),
      memberId,
      type: type.toUpperCase(),
      isLegacy: false,
      isExpired: true,
      timestamp,
      warning: `توکن QR بیش از ۱۲۰ ثانیه قبل تولید شده و منقضی است، اما جهت سازگاری و تسهیل تردد ثبت گردید.`,
    };
  }

  return {
    valid: true,
    membershipCode: code.toUpperCase(),
    memberId,
    type: type.toUpperCase(),
    isLegacy: false,
    isExpired: false,
    timestamp,
  };
}
