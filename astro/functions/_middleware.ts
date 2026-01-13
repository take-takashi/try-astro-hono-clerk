import { handleMiddleware } from "hono/cloudflare-pages";
import type { EventContext } from "hono/cloudflare-pages";
import { verifyToken } from "@clerk/backend";

// Cloudflare Pages Middleware:
// - `/members/*` is protected
// - If authenticated: serve the prebuilt static asset via `env.ASSETS.fetch(request)`
// - Otherwise: redirect to `/sign-in`
//
// NOTE: This file must be placed at the project root as `functions/_middleware.ts`
// (NOT under `src/`). Keep this file here for now, but move it before deploying.

type Bindings = {
  CLERK_JWT_KEY: string;
};

type Env = {
  Bindings: {
    // Hono's Cloudflare Pages adapter exposes the Pages EventContext here.
    // This gives us access to `eventContext.env.ASSETS.fetch()`.
    eventContext: EventContext<Bindings>;
  };
};

function getCookieValue(
  cookieHeader: string | null,
  name: string
): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export const onRequest = handleMiddleware<Env>(async (c, next) => {
  const url = new URL(c.req.url);

  // Only guard /members/*
  if (!url.pathname.startsWith("/members/")) {
    await next();
    return;
  }

  const pagesEnv = c.env.eventContext.env;

  // Clerk session token is commonly provided via the __session cookie.
  // (You can also support Authorization: Bearer if you want.)
  const auth = c.req.header("authorization");
  const bearer = auth?.replace(/^Bearer\s+/i, "");
  const cookieHeader = c.req.header("cookie") ?? null;
  const session = bearer ?? getCookieValue(cookieHeader, "__session");

  if (!session) {
    return Response.redirect(new URL("/sign-in", c.req.url), 302);
  }

  try {
    // 本番環境でverifyTokenにauthorizedPartiesを設定する
    await verifyToken(session, { jwtKey: pagesEnv.CLERK_JWT_KEY });
  } catch {
    return Response.redirect(new URL("/sign-in", c.req.url), 302);
  }

  // Auth OK -> return the already-built static asset (SSG output)
  // Cloudflare Pages requires a "pretty" URL (e.g. /members/foo/ instead of /members/foo/index.html)
  return pagesEnv.ASSETS.fetch(c.req.raw);
});
