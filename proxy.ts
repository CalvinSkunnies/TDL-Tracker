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

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authed = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname === LOGIN_PATH) {
    // Already signed in: go straight to the tracker.
    return authed
      ? NextResponse.redirect(new URL(HOME_PATH, request.url))
      : NextResponse.next();
  }

  if (authed) return NextResponse.next();

  const loginUrl = new URL(LOGIN_PATH, request.url);
  if (pathname !== "/tdl") loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Only the tracker is gated. Keep Next's build output public, or the login
  // page could not load its own JS and CSS.
  matcher: ["/tdl", "/tdl/((?!_next/static|_next/image).*)"],
};
