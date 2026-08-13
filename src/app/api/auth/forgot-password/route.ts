import { json, readBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ success: true, message: "POST email to request a reset." });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const email = String(body.email || body.phone || "").trim();
  if (!email) {
    return json({ error: "Email is required" }, 400);
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone: email }] },
  });

  if (user) {
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "password_reset",
          title: "Password reset",
          body: "A reset was requested for this account.",
          channel: "IN_APP",
        },
      });
    } catch {
      /* demo store may omit fields */
    }
  }

  return json({ success: true, message: "If that inbox exists, a quiet note is on its way." });
}
