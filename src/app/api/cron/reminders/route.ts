import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  const isDummy = !secret || secret.startsWith("optional-");
  if (!isDummy && header !== `Bearer ${secret}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  return json({ success: true, sent: 0, total: 0, note: "Demo reminders — no queue." });
}

export const POST = GET;
