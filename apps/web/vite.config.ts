import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// Las pruebas de punta a punta levantan su propia API en otro puerto.
const API = process.env['API_URL'] ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // En desarrollo el navegador ve un único origen: Vite redirige la API y Socket.IO.
    proxy: {
      '/api': API,
      '/socket.io': { target: API, ws: true },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
});
