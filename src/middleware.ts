import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isManager, isStaff } from "@/lib/permissions";

const managerRoles = ["OWNER", "ADMIN", "MANAGER"];

export default auth((req) => {
  const role = (req.auth?.user as any)?.role as string | undefined;
  const path = req.nextUrl.pathname;

  // Allow public routes
  if (path.startsWith("/sign-in") || path.startsWith("/sign-up") || path.startsWith("/forgot-password") || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protect manager routes
  if (path.startsWith("/manager")) {
    if (!role) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    if (!managerRoles.includes(role) && !isManager(role)) {
      // If member tries to access manager, redirect to their dashboard
      if (role === "MEMBER") {
        return NextResponse.redirect(new URL("/member/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  // Protect trainer routes (if any)
  if (path.startsWith("/trainer")) {
    if (!role) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    if (!isStaff(role)) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  // Protect member routes - allow MEMBER and also managers for preview
  if (path.startsWith("/member")) {
    if (!role) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    // Allow MEMBER or any manager/owner to view member area
    if (role !== "MEMBER" && !isManager(role) && !isStaff(role)) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/manager/:path*", "/trainer/:path*", "/member/:path*"],
};
