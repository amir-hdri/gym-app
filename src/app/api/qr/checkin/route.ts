import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkInByCode } from "@/server/actions/attendance";

const staffRoles: string[] = ["OWNER", "ADMIN", "MANAGER", "TRAINER"];

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;

  if (!role || !staffRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden: Only staff can check in members" }, { status: 403 });
  }

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  // Pass session.user.id to log who verified the check-in
  const result = await checkInByCode(code, session.user.id);
  return NextResponse.json(result);
}
