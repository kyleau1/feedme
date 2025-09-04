import { clerkMiddleware, redirectToSignIn } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export default clerkMiddleware({
  // redirect users who aren't signed in
  publicRoutes: ["/sign-in*", "/sign-up*", "/"], // routes that don’t require auth
});

// Optionally, you can export a config to match all routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"], // all routes except static
};
