import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ success: true, count: 214, currentlyInside: [{ name: "Sarah Chen", room: "Letting Go" }] });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const code = String(body.code || body.token || "MEM-001");
  return json({ success: true, action: "checkin", code, at: new Date().toISOString() });
}
