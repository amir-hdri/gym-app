import { json, demoCatalog } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ success: true, sessions: demoCatalog });
}
