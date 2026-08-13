import { json, readBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export function GET() {
  return json({ success: true, message: "POST name, email, password to create an account." });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  const phone = String(body.phone || email || "").trim();

  if (!name || !password || (!email && !phone)) {
    return json({ error: "Name, email, and password are required" }, 400);
  }
  if (password.length < 6) {
    return json({ error: "Password must be at least 6 characters" }, 400);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email || undefined }, { phone }] },
  });
  if (existing) {
    return json({ error: "An account already uses that email" }, 400);
  }

  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({ data: { name: "Twilight Studio" } });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email: email || null,
      phone,
      passwordHash,
      role: "MEMBER",
      branchId: branch.id,
      memberProfile: { create: { membershipCode: "MEM-" + Date.now().toString(36).toUpperCase() } },
    },
  });

  return json({ success: true, message: "Account created" }, 201);
}
