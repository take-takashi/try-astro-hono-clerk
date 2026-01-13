// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import clerk from "@clerk/astro";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  output: "static", // SSRのページは export const prerender = false を指定する
  adapter: cloudflare(),
  // Can accept options, such as { signInForceRedirectUrl: '/dashboard' }
  integrations: [clerk(), react()],
});
