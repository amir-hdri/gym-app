import { NextResponse } from "next/server";
import { checkInByCode } from "@/server/actions/attendance";

export async function POST(req: Request) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });
  const result = await checkInByCode(code);
  return NextResponse.json(result);
}
