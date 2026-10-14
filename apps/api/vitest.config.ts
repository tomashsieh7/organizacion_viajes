import { defineConfig } from 'vitest/config';

// Dos proyectos: las pruebas rápidas corren en paralelo y sin base; las que terminan en
// `.bd.test.ts` usan la base PostgreSQL de prueba (docker compose, puerto 5433) y corren
// de a un archivo para no pisarse los datos.
export default defineConfig({
  test: {
    // `npm run test:cobertura`: cobertura del código propio, sin el cliente generado de Prisma.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generado/**', 'src/tipos/**'],
      reporter: ['text-summary', 'html'],
      // Mínimos unos puntos por debajo de la medición del 2026-10-14, para notar si la
      // cobertura baja sin que molesten las variaciones chicas.
      thresholds: { lines: 96, statements: 94, branches: 84, functions: 97 },
    },
    projects: [
      {
        test: {
          name: 'rapidas',
          environment: 'node',
          include: ['test/**/*.test.ts'],
          exclude: ['test/**/*.bd.test.ts'],
        },
      },
      {
        test: {
          name: 'bd',
          environment: 'node',
          include: ['test/**/*.bd.test.ts'],
          globalSetup: ['test/soporte/prepararBaseDePrueba.ts'],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
