import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !isManager((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, address, city, email } = body;

    let branch = await prisma.branch.findFirst();
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: name?.trim() || "شعبه اصلی",
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          email: email?.trim() || null,
        },
      });
    } else {
      branch = await prisma.branch.update({
        where: { id: branch.id },
        data: {
          name: name?.trim() || branch.name,
          phone: phone?.trim() || branch.phone,
          address: address?.trim() || branch.address,
          city: city?.trim() || branch.city,
          email: email?.trim() || branch.email,
        },
      });
    }

    return NextResponse.json({ success: true, branch });
  } catch (e: any) {
    console.error("Branch settings error", e);
    return NextResponse.json({ error: e.message || "خطا" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const branch = await prisma.branch.findFirst();
    return NextResponse.json({ branch });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
