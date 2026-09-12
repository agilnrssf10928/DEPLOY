import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  if (isDashboard && !req.auth) {
    return NextResponse.redirect(new URL("/", req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*"],
}