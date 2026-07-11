import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Canonical production domain — the stable Vercel alias that is always
// in Firebase's authorized-domains list.
const CANONICAL = "frontend-mu-pied-60.vercel.app";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Only redirect on Vercel preview/deployment URLs (*.vercel.app),
  // NOT on the canonical alias and NOT on localhost.
  const isVercelPreview =
    host.endsWith(".vercel.app") &&
    host !== CANONICAL &&
    !host.startsWith("localhost");

  if (isVercelPreview) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL;
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, {
      status: 301, // permanent — browsers/PWA won't revisit the old URL
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon-|apple-touch|sw\\.js|manifest|robots\\.txt).*)",
  ],
};
