import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return json({
    ok: true,
    app: "Twilight Meditation",
    time: new Date().toISOString(),
  });
}
