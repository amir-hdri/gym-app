import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ success: true, message: "POST a code for auto check-in/out." });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const code = String(body.code || body.token || "MEM-001");
  return json({ success: true, action: "auto", code, at: new Date().toISOString() });
}
