import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { autoCheckInOut } from "@/server/actions/attendance";
import { isManager } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (!isManager(role)) {
      return NextResponse.json(
        { error: "فقط مدیران می‌توانند تردد هوشمند را ثبت کنند" },
        { status: 403 }
      );
    }

    const { code, token, type = "REGULAR", note } = await req.json();
    const rawCode = String(code || token || "").trim();
    if (!rawCode) {
      return NextResponse.json(
        { error: "کد عضویت یا توکن QR الزامی است" },
        { status: 400 }
      );
    }

    const result = await autoCheckInOut(rawCode, session.user.id, { type, note });
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("QR auto checkin/checkout error", e);
    return NextResponse.json({ error: e.message || "خطا در پردازش هوشمند" }, { status: 500 });
  }
}
