import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ success: true, message: "POST a code to check out." });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const code = String(body.code || body.token || "MEM-001");
  return json({ success: true, action: "checkout", code, at: new Date().toISOString() });
}
