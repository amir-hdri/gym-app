import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let name = "";
    let phone = "";
    let email = "";
    let password = "";

    if (contentType.includes("form")) {
      const formData = await req.formData();
      name = (formData.get("name") as string) || "";
      phone = (formData.get("phone") as string) || "";
      email = (formData.get("email") as string) || "";
      password = (formData.get("password") as string) || "";
    } else {
      const body = await req.json();
      name = body.name || "";
      phone = body.phone || "";
      email = body.email || "";
      password = body.password || "";
    }

    if (!name || !phone || !password) {
      return NextResponse.json({ error: "نام، شماره تلفن و رمز عبور الزامی هستند" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "رمز عبور حداقل ۶ کاراکتر باید باشد" }, { status: 400 });
    }

    // Basic phone sanitization
    const sanitizedPhone = phone.trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: sanitizedPhone },
    });

    if (existingUser) {
      return NextResponse.json({ error: "کاربری با این شماره تلفن قبلاً ثبت‌نام کرده است" }, { status: 400 });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: email.trim() || undefined } }).catch(() => null);
      if (existingEmail) {
        return NextResponse.json({ error: "این ایمیل قبلاً استفاده شده است" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const membershipCode = "MEM-" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random()*1000).toString(36).toUpperCase();

    // Find default branch or create
    let branch = await prisma.branch.findFirst();
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: "شعبه اصلی",
          address: "تهران، خیابان آزادی",
          phone: "+98-21-0000",
          city: "تهران",
        }
      });
    }

    await prisma.user.create({
      data: {
        name: name.trim(),
        phone: sanitizedPhone,
        email: email?.trim() || null,
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

    if (contentType.includes("form")) {
      return NextResponse.redirect(new URL("/sign-in?registered=1", req.url), 303);
    }

    return NextResponse.json({ success: true, message: "ثبت نام با موفقیت انجام شد" }, { status: 201 });
  } catch (error: any) {
    console.error("Register error:", error);
    // Handle unique constraint
    if (error.code === "P2002") {
      return NextResponse.json({ error: "شماره تلفن یا ایمیل تکراری است" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطایی در ثبت‌نام رخ داد: " + (error.message || "نامشخص") }, { status: 500 });
  }
}
