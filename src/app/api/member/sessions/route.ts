import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getMemberSessionStats,
  getMemberTodaySchedule,
  getMemberSessions,
} from "@/server/actions/attendance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryType = searchParams.get("type");
    const userId = session.user.id;

    if (queryType === "stats") {
      const stats = await getMemberSessionStats(userId);
      return NextResponse.json({ success: true, stats });
    }

    if (queryType === "today-schedule") {
      const todaySchedule = await getMemberTodaySchedule(userId);
      return NextResponse.json({ success: true, todaySchedule });
    }

    if (queryType === "history") {
      const history = await getMemberSessions(userId, 50);
      return NextResponse.json({ success: true, history });
    }

    // Default: return comprehensive bundle
    const [stats, todaySchedule, history] = await Promise.all([
      getMemberSessionStats(userId),
      getMemberTodaySchedule(userId),
      getMemberSessions(userId, 20),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      todaySchedule,
      history,
    });
  } catch (error: any) {
    console.error("Member sessions API error:", error);
    return NextResponse.json(
      { error: error.message || "خطا در دریافت اطلاعات جلسات" },
      { status: 500 }
    );
  }
}
