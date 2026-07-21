import { NextResponse } from "next/server";
import { sendExpiryReminders } from "@/server/actions/notifications";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await sendExpiryReminders();
  return NextResponse.json({ sent: results.length });
}
