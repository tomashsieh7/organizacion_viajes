import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { createLogger } from 'vite';

// Las pruebas de punta a punta levantan su propia API en otro puerto.
const API = process.env['API_URL'] ?? 'http://localhost:3000';

// Cuando el navegador cierra o recarga la página, el websocket del chat se corta y el proxy
// informa un ECONNRESET que no es una falla; los demás errores se siguen mostrando.
const registro = createLogger();
const registrarError = registro.error.bind(registro);
registro.error = (mensaje, opciones) => {
  const codigo = (opciones?.error as NodeJS.ErrnoException | null | undefined)?.code;
  if (mensaje.includes('ws proxy') && codigo === 'ECONNRESET') return;
  registrarError(mensaje, opciones);
};

export default defineConfig({
  plugins: [vue()],
  customLogger: registro,
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
    // `npm run test:cobertura`: cobertura de los componentes, vistas, stores y utilidades.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/env.d.ts', 'src/main.ts'],
      reporter: ['text-summary', 'html'],
      // Mínimos unos puntos por debajo de la medición del 2026-10-14, para notar si la
      // cobertura baja sin que molesten las variaciones chicas.
      thresholds: { lines: 84, statements: 82, branches: 80, functions: 74 },
    },
  },
});
