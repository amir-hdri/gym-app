import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSecureQrToken } from "@/lib/qr";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "ENTRY").toUpperCase();

    // Find member profile
    const profile = await prisma.memberProfile.findFirst({
      where: { userId: session.user.id },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "پروفایل عضویت برای این کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const token = generateSecureQrToken(
      profile.membershipCode,
      profile.id,
      type
    );

    const qrUrl = await QRCode.toDataURL(token, {
      margin: 1,
      width: 260,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      token,
      qrUrl,
      membershipCode: profile.membershipCode,
      memberId: profile.id,
      type,
      expiresInSeconds: 120,
      rotationInterval: 30,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: error.message || "خطا در تولید کد QR امن" },
      { status: 500 }
    );
  }
}
