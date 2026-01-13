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

// Cloudflare Pages の環境変数（Bindings）に載るもの
type Bindings = {
  CLERK_JWT_KEY: string;
};

// Hono の Cloudflare Pages adapter が渡す環境コンテキスト
type Env = {
  Bindings: {
    // Pages の EventContext から ASSETS などにアクセスするため
    eventContext: EventContext<Bindings>;
  };
};

// Cookie ヘッダーから指定名の値を取り出す
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

  // /members/* 配下のみ保護対象とする
  if (!url.pathname.startsWith("/members/")) {
    await next();
    return;
  }

  // Cloudflare Pages の env（ASSETS や Bindings へアクセス）
  const pagesEnv = c.env.eventContext.env;

  // Clerk セッショントークンの取得:
  // - Authorization: Bearer <token>
  // - __session Cookie
  const auth = c.req.header("authorization");
  const bearer = auth?.replace(/^Bearer\s+/i, "");
  const cookieHeader = c.req.header("cookie") ?? null;
  const session = bearer ?? getCookieValue(cookieHeader, "__session");

  // トークンがなければサインインへ誘導
  if (!session) {
    return Response.redirect(new URL("/sign-in", c.req.url), 302);
  }

  try {
    // Clerk 署名検証（本番環境では authorizedParties の設定も検討）
    await verifyToken(session, { jwtKey: pagesEnv.CLERK_JWT_KEY });
  } catch {
    return Response.redirect(new URL("/sign-in", c.req.url), 302);
  }

  // 認証 OK: 事前ビルド済みの静的アセットを返す
  // Cloudflare Pages は "pretty URL" を前提に ASSETS を返す
  return pagesEnv.ASSETS.fetch(c.req.raw);
});
