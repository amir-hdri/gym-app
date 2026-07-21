import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
const managerRoles: string[] = ["OWNER", "ADMIN", "MANAGER"];
const staffRoles: string[] = ["OWNER", "ADMIN", "MANAGER", "TRAINER"];

export default auth((req) => {
  const role = (req.auth?.user as any)?.role as string | undefined;
  const path = req.nextUrl.pathname;

  if (!role && (path.startsWith("/manager") || path.startsWith("/member") || path.startsWith("/trainer"))) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (path.startsWith("/manager") && !managerRoles.includes(role!)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (path.startsWith("/trainer") && !staffRoles.includes(role!)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (path.startsWith("/member") && role !== "MEMBER") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/manager/:path*", "/trainer/:path*", "/member/:path*"],
};
