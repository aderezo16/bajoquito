import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// base './' so the build works from any folder or subdomain (Hostinger, previews)
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), catalogo: resolve(__dirname, 'catalogo.html') } },
  },
});
