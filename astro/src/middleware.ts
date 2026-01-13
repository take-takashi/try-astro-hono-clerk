import { clerkMiddleware } from "@clerk/astro/server";

export const onRequest = clerkMiddleware();

// このファイルはpages内でSSRページを作成するときに意味がある
// （export const prerender = false のページ）
