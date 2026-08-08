import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let phone = "";
    
    if (contentType.includes("form")) {
      const formData = await req.formData();
      phone = (formData.get("phone") as string) || "";
    } else {
      const body = await req.json();
      phone = body.phone || "";
    }

    if (!phone) {
      return NextResponse.json({ error: "شماره تلفن الزامی است" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone: phone.trim() } });

    // Always return success to avoid user enumeration, but log internally
    if (!user) {
      return NextResponse.json({ success: true, message: "اگر شماره شما در سیستم باشد، کد بازیابی ارسال خواهد شد." });
    }

    // In a real app, we would generate a token and send SMS
    // For now, we just simulate
    console.log(`[forgot-password] Password reset requested for ${phone}. User: ${user.id}`);

    // Create a notification for the user
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "password_reset",
          title: "درخواست بازیابی رمز عبور",
          body: "درخواست بازیابی رمز عبور شما ثبت شد. لطفاً با پشتیبانی تماس بگیرید.",
          channel: "IN_APP",
        }
      });
    } catch (e) {
      console.warn("[forgot-password] failed to create notification", e);
    }

    if (contentType.includes("form")) {
      return NextResponse.redirect(new URL("/sign-in?reset=1", req.url), 303);
    }

    return NextResponse.json({ 
      success: true, 
      message: "کد بازیابی (شبیه‌سازی) به شماره شما ارسال شد. برای بازیابی واقعی با مدیریت تماس بگیرید. کد آزمایشی: 123456" 
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "خطایی رخ داد" }, { status: 500 });
  }
}

// For GET, show simple status
export async function GET() {
  return NextResponse.json({ message: "Use POST to request password reset" });
}
