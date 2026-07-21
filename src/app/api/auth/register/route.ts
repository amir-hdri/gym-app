import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let name = "";
    let phone = "";
    let email = "";
    let password = "";

    if (contentType.includes("form")) {
      const formData = await req.formData();
      name = formData.get("name") as string;
      phone = formData.get("phone") as string;
      email = formData.get("email") as string;
      password = formData.get("password") as string;
    } else {
      const body = await req.json();
      name = body.name;
      phone = body.phone;
      email = body.email;
      password = body.password;
    }

    if (!name || !phone || !password) {
      return NextResponse.json({ error: "نام، شماره تلفن و رمز عبور الزامی هستند" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json({ error: "کاربری با این شماره تلفن قبلاً ثبت‌نام کرده است" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const membershipCode = "MEM-" + Date.now().toString(36).toUpperCase();

    // Find default branch
    const branch = await prisma.branch.findFirst() || await prisma.branch.create({
      data: {
        name: "شعبه اصلی",
        address: "تهران، خیابان آزادی",
      }
    });

    await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        passwordHash,
        role: "MEMBER",
        branchId: branch.id,
        memberProfile: {
          create: {
            membershipCode,
          },
        },
      },
    });

    // Redirect to sign-in page
    return NextResponse.redirect(new URL("/sign-in", req.url), 303);
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "خطایی در ثبت‌نام رخ داد: " + error.message }, { status: 500 });
  }
}
