import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  define: {
    'process.env': {},
    global: 'window',
  },
  resolve: {
    alias: {
      events: 'events',
      url: 'url',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
