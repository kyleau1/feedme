import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/custom-signup(.*)",
  "/",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

// Optionally, you can export a config to match all routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"], // all routes except static
};
