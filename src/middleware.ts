import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// With the dev bypass on, skip Clerk middleware entirely so the dev-browser
// handshake never redirects to *.accounts.dev. A no-op middleware just passes
// the request through (equivalent to NextResponse.next()).
export default DEV_AUTH_BYPASS
  ? function middleware() {}
  : clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    });

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|map|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
