import { NextResponse } from "next/server";
import { sessions } from "@/lib/catalog";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readBody(req: Request): Promise<Record<string, any>> {
  const type = req.headers.get("content-type") || "";
  try {
    if (type.includes("form")) {
      const form = await req.formData();
      return Object.fromEntries(form.entries());
    }
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export const demoStats = {
  totalHours: 12.5,
  streakDays: 5,
  sessions: 142,
  longestStreak: 12,
  courses: 24,
};

export const demoCatalog = sessions;
