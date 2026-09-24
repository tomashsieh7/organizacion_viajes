import { defineConfig, devices } from '@playwright/test';
import { ORIGEN_WEB, PUERTO_API, PUERTO_WEB, URL_BASE_E2E } from './soporte/constantes.js';

/**
 * Pruebas de punta a punta (F9). Levantan su propia API y su propia web en otros puertos, contra
 * la base `viajes_e2e`, así no chocan con el entorno de desarrollo ni con las pruebas de Vitest.
 * Si el navegador ya está instalado en otra ruta, se indica con `E2E_CHROMIUM`; si no, alcanza con
 * `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  // Los flujos comparten la base: se ejecutan de a uno.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../playwright-report' }]],
  outputDir: '../test-results',
  globalSetup: './soporte/prepararTodo.ts',
  use: {
    baseURL: ORIGEN_WEB,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
    launchOptions: process.env['E2E_CHROMIUM']
      ? { executablePath: process.env['E2E_CHROMIUM'] }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run build -w packages/compartido && npx tsx apps/api/src/servidor.ts',
      cwd: '..',
      url: `http://localhost:${PUERTO_API}/api/salud`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: String(PUERTO_API),
        NODE_ENV: 'test',
        ORIGEN_WEB,
        DATABASE_URL: URL_BASE_E2E,
        // Cada flujo registra usuarios nuevos desde la misma IP.
        REGISTROS_POR_HORA: '1000',
      },
    },
    {
      command: `npx vite --port ${PUERTO_WEB} --strictPort`,
      cwd: '../apps/web',
      url: ORIGEN_WEB,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { API_URL: `http://localhost:${PUERTO_API}` },
    },
  ],
});
