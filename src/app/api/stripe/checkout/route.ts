import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ success: true, available: false, message: "Checkout is simulated in this preview." });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  return json({
    success: true,
    simulated: true,
    planId: body.planId || "plus",
    url: "/member/membership?success=1",
  });
}
