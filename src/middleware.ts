import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    const isAuthPage = nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/signup") ||
        nextUrl.pathname.startsWith("/verify")

    const isProtectedPage = nextUrl.pathname.startsWith("/dashboard")

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }

    if (isProtectedPage && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
