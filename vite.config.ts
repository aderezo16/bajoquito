import { defineConfig, Plugin } from 'vite';
import { resolve } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * The game's logic and windows (prototype v0.9, in legacy/parts) are plain scripts that share one scope.
 * They are joined in order and placed in the game page as a classic script; the 3D city boots them.
 */
function legacyGame(): Plugin {
  const dir = resolve(__dirname, 'legacy/parts');
  const code = () => readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => readFileSync(resolve(dir, f), 'utf8')).join('\n');
  return {
    name: 'legacy-game',
    configureServer(server) { server.watcher.add(dir); server.watcher.on('change', f => { if (f.startsWith(dir)) server.ws.send({ type: 'full-reload' }); }); },
    transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('/index.html')) return html;
      const js = code();
      if (/<\/script|<!--/i.test(js)) throw new Error('legacy code contains </script or <!--');
      return html.replace('<!--LEGACY-->', `<script>\n${js}\n</script>`);
    },
  };
}

// base './' so the build works from any folder or subdomain (Hostinger, previews)
export default defineConfig({
  base: './',
  plugins: [legacyGame()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), catalogo: resolve(__dirname, 'catalogo.html') } },
  },
});
