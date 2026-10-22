import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * The auth gate for the tracker. Runs before routing, so a protected page is
 * never rendered (or served from the static cache) for an anonymous visitor.
 *
 * The portfolio at "/" is public; only /tdl/* is private. Next.js 16 renamed
 * `middleware.ts` to `proxy.ts`; it is the same feature.
 */
const LOGIN_PATH = "/tdl/login";
const HOME_PATH = "/tdl/tracker";

/**
 * The browser's host. Behind the portfolio's Vercel rewrite the tracker runs on
 * its own deployment, but `x-forwarded-host` still names the domain the visitor
 * typed, so redirects and cookies stay on that domain.
 */
function requestOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function redirectTo(request: NextRequest, location: string) {
  return NextResponse.redirect(new URL(location, requestOrigin(request)));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authed = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname === LOGIN_PATH) {
    // Already signed in: go straight to the tracker.
    return authed ? redirectTo(request, HOME_PATH) : NextResponse.next();
  }

  if (authed) return NextResponse.next();

  if (pathname === "/tdl") return redirectTo(request, LOGIN_PATH);
  const next = encodeURIComponent(pathname + search);
  return redirectTo(request, `${LOGIN_PATH}?next=${next}`);
}

export const config = {
  // Only the tracker is gated. Keep Next's build output public, or the login
  // page could not load its own JS and CSS.
  matcher: ["/tdl", "/tdl/((?!_next/static|_next/image).*)"],
};
