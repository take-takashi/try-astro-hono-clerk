// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import clerk from "@clerk/astro";
import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // SSRのページは export const prerender = false を指定する
  output: "static",

  adapter: cloudflare(),

  // Can accept options, such as { signInForceRedirectUrl: '/dashboard' }
  integrations: [clerk(), react()],

  vite: {
    plugins: [tailwindcss()],
  },
});