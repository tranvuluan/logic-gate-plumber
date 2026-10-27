import { defineConfig, Plugin } from 'vite';

const apkMimePlugin = (): Plugin => ({
  name: 'apk-mime-type',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.toLowerCase().includes('.apk')) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="LogicGatePlumber-release.apk"');
      }
      if (req.url && req.url.toLowerCase().includes('.aab')) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename="LogicGatePlumber-production.aab"');
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.toLowerCase().includes('.apk')) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="LogicGatePlumber-release.apk"');
      }
      if (req.url && req.url.toLowerCase().includes('.aab')) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename="LogicGatePlumber-production.aab"');
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [apkMimePlugin()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    open: false,
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: true,
  },
});
