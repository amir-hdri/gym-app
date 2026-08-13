import { NextResponse } from "next/server";

/** UI preview: all Twilight screens are public. Auth APIs stay available. */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/manager/:path*", "/trainer/:path*", "/member/:path*"],
};
