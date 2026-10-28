import { defineConfig } from 'vite';

export default defineConfig({
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

