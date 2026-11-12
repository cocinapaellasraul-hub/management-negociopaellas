import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
// 1. Usamos la integración oficial de Astro (versión 3)
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    // 2. La activamos aquí
    tailwind()
  ],
  devToolbar: {enabled: false},
});