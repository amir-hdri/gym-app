import { json, demoCatalog, demoStats } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type");
  if (type === "stats") return json({ success: true, stats: demoStats });
  if (type === "today-schedule") return json({ success: true, todaySchedule: demoCatalog.slice(0, 3) });
  if (type === "history") return json({ success: true, history: demoCatalog });
  return json({ success: true, stats: demoStats, catalog: demoCatalog });
}

export const POST = GET;
