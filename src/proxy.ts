import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isClerkConfigured } from "@/lib/config-state";

const isPublicRoute = createRouteMatcher(["/api/health(.*)"]);
const protectedProxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) await auth.protect();
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) return NextResponse.next();
  return protectedProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
