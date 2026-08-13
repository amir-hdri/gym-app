import { json, readBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const branch = (await prisma.branch.findFirst()) || {
    id: "studio-1",
    name: "Twilight Studio",
  };
  return json({ success: true, branch });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: { name: body.name || "Twilight Studio", phone: body.phone || null, email: body.email || null },
    });
  } else {
    branch = await prisma.branch.update({
      where: { id: branch.id },
      data: {
        name: body.name || branch.name,
        phone: body.phone || branch.phone,
        email: body.email || branch.email,
        address: body.address || branch.address,
        city: body.city || branch.city,
      },
    });
  }
  return json({ success: true, branch });
}
