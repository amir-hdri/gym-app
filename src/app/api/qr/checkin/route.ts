import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkInByCode } from "@/server/actions/attendance";
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
      return NextResponse.json({ error: "فقط مدیران می‌توانند حضور را ثبت کنند" }, { status: 403 });
    }

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "کد عضویت الزامی است" }, { status: 400 });
    
    const result = await checkInByCode(String(code).trim(), session.user.id);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("QR checkin error", e);
    return NextResponse.json({ error: e.message || "خطا" }, { status: 500 });
  }
}
