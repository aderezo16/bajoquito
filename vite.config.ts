import { defineConfig } from 'vite';

// base './' so the build works from any folder or subdomain (Hostinger, previews)
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
});
