import { NextRequest, NextResponse } from "next/server";

const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const CLICK_ID_PARAMS = [
  "fbclid",
  "ttclid",
  "gclid",
  "gbraid",
  "wbraid",
] as const;

const ALL_PARAMS = [...UTM_PARAMS, ...CLICK_ID_PARAMS] as const;

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const response = NextResponse.next();

  // Extract attribution params from URL
  const attrs: Record<string, string> = {};
  for (const param of ALL_PARAMS) {
    const value = searchParams.get(param);
    if (value) attrs[param] = value;
  }

  // No attribution params found — pass through
  if (Object.keys(attrs).length === 0) return response;

  // Build attribution data
  const data = {
    ...attrs,
    landingPage: request.nextUrl.pathname,
    referrer: request.headers.get("referer") || "",
    timestamp: new Date().toISOString(),
  };

  const cookieOptions = {
    path: "/",
    maxAge: THIRTY_DAYS,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  // First-touch: only set if it doesn't exist
  const existingFirstTouch = request.cookies.get("_sv_attr");
  if (!existingFirstTouch) {
    response.cookies.set("_sv_attr", JSON.stringify(data), cookieOptions);
  }

  // Last-touch: always update
  response.cookies.set("_sv_attr_last", JSON.stringify(data), cookieOptions);

  // Handle fbclid → _fbc cookie
  if (attrs.fbclid) {
    const existingFbc = request.cookies.get("_fbc");
    if (!existingFbc) {
      const fbc = `fb.1.${Date.now()}.${attrs.fbclid}`;
      response.cookies.set("_fbc", fbc, cookieOptions);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|health).*)"],
};
