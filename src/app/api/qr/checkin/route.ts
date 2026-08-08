import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  checkInByCode,
  checkOutByCode,
  autoCheckInOut,
  getCurrentlyInside,
} from "@/server/actions/attendance";
import { isManager } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (!isManager(role)) {
      return NextResponse.json(
        { error: "دسترسی فقط برای مدیران مجاز است" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || undefined;

    const inside = await getCurrentlyInside(branchId);
    return NextResponse.json({ success: true, count: inside.length, currentlyInside: inside });
  } catch (e: any) {
    console.error("GET currentlyInside error", e);
    return NextResponse.json({ error: e.message || "خطا" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (!isManager(role)) {
      return NextResponse.json(
        { error: "فقط مدیران می‌توانند حضور را ثبت کنند" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, token, mode = "entry", type = "REGULAR", note } = body;
    const rawCode = String(code || token || "").trim();

    if (!rawCode) {
      return NextResponse.json(
        { error: "کد عضویت یا توکن QR الزامی است" },
        { status: 400 }
      );
    }

    let result;
    if (mode === "auto") {
      result = await autoCheckInOut(rawCode, session.user.id, { type, note });
    } else if (mode === "exit") {
      result = await checkOutByCode(rawCode, session.user.id, { type, note });
    } else {
      result = await checkInByCode(rawCode, session.user.id, { type, note });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("QR checkin error", e);
    return NextResponse.json({ error: e.message || "خطا در پردازش" }, { status: 500 });
  }
}
