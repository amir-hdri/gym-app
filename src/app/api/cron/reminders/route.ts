import { NextResponse } from "next/server";
import { sendExpiryReminders } from "@/server/actions/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  // If CRON_SECRET is set, enforce it, otherwise allow in dev
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    const results = await sendExpiryReminders();
    const sentCount = results.filter((r: any) => r.status === "fulfilled").length;
    return NextResponse.json({ sent: sentCount, total: results.length });
  } catch (e: any) {
    console.error("Cron reminders error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
