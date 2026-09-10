// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

import react from '@astrojs/react';
import vue from '@astrojs/vue';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    vue(),
    svelte(),
    {
      name: 'isolate-vite-cache',
      hooks: {
        'astro:config:setup': ({ command, config, updateConfig }) => {
          // Prerendering also optimizes dependencies. Keep production React
          // out of a running dev server's cache (its JSX needs jsxDEV).
          updateConfig({
            vite: {
              cacheDir: fileURLToPath(new URL(`./node_modules/.vite-${command}/`, config.root)),
            },
          });
        },
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel()
});
