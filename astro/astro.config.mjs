// @ts-check
import { defineConfig } from "astro/config";
import clerk from "@clerk/astro";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  // Can accept options, such as { signInForceRedirectUrl: '/dashboard' }
  integrations: [clerk(), react()],
});
