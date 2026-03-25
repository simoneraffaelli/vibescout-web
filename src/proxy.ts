import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // ── Security headers ───────────────────────────────────
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set("X-XSS-Protection", "0"); // modern browsers should use CSP
  const scriptSrc =
    process.env.NODE_ENV === "development"
      ? "'self' 'unsafe-inline' 'unsafe-eval'"
      : "'self' 'unsafe-inline'";
  res.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://coverartarchive.org https://archive.org https://*.archive.org; font-src 'self'; connect-src 'self'; frame-ancestors 'none'`
  );

  // ── CSRF protection for admin mutation routes ──────────
  const method = req.method;
  if (
    ["POST", "PATCH", "PUT", "DELETE"].includes(method) &&
    req.nextUrl.pathname.startsWith("/api/admin")
  ) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    // Allow requests with no Origin header (same-origin form posts in some browsers)
    // but reject mismatched origins
    if (origin && host) {
      let originHost: string;
      try {
        originHost = new URL(origin).host;
      } catch {
        return NextResponse.json(
          { error: "Invalid Origin header" },
          { status: 403 }
        );
      }
      if (originHost !== host) {
        return NextResponse.json(
          { error: "CSRF check failed: origin mismatch" },
          { status: 403 }
        );
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
