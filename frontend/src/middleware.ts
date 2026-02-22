import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = [
  "/ideas",
  "/portfolio",
  "/sprints",
  "/frameworks",
  "/prior-art",
  "/landscaping",
  "/alignment",
  "/settings",
  "/teams",
  "/admin",
  "/onboarding",
];

// Routes that require business_admin role
const ADMIN_PATHS = ["/admin"];

// Routes that skip the onboarding gate
const ONBOARDING_EXEMPT = ["/onboarding", "/api", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ─── Layer 1: Auth check ─────────────────────────────────────
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req: request });

  if (!token?.dbUserId) {
    const loginUrl = new URL("/login", request.url);
    // Preserve full path + query params as callbackUrl
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Layer 2: Onboarding gate ────────────────────────────────
  const isOnboardingExempt = ONBOARDING_EXEMPT.some((p) => pathname.startsWith(p));
  if (!isOnboardingExempt && token.onboardingComplete === false) {
    const onboardingUrl = new URL("/onboarding", request.url);
    // If user is heading to join a team with a code, carry it through onboarding
    const inviteCode = request.nextUrl.searchParams.get("code");
    if (inviteCode) {
      onboardingUrl.searchParams.set("invite", inviteCode);
    } else if (pathname === "/teams/join" || pathname.startsWith("/teams/join")) {
      // The code might be in the URL path for join page
      const codeParam = request.nextUrl.searchParams.get("code");
      if (codeParam) onboardingUrl.searchParams.set("invite", codeParam);
    }
    return NextResponse.redirect(onboardingUrl);
  }

  // ─── Layer 3: Role-based route protection ────────────────────
  const isAdminRoute = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminRoute && token.orgRole !== "business_admin") {
    // Redirect non-admins to ideas page
    return NextResponse.redirect(new URL("/ideas", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ideas/:path*",
    "/portfolio/:path*",
    "/sprints/:path*",
    "/frameworks/:path*",
    "/prior-art/:path*",
    "/landscaping/:path*",
    "/alignment/:path*",
    "/settings/:path*",
    "/teams/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};
