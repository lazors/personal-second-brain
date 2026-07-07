import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      // autoprefixer intentionally omitted: this is a local app targeting
      // modern browsers, and the autoprefixer→browserslist dependency was
      // corrupted in this environment.
      plugins: [tailwindcss()],
    },
  },
  server: {
    // Forward API calls to the local Node server so the browser app stays
    // same-origin (no CORS) and never holds secrets or file access itself.
    proxy: {
      '/api': {
        target: 'http://localhost:6767',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.js'],
    css: false,
  },
});
