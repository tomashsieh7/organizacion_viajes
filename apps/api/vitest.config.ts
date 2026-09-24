import { defineConfig } from 'vitest/config';

// Dos proyectos: las pruebas rápidas corren en paralelo y sin base; las que terminan en
// `.bd.test.ts` usan la base PostgreSQL de prueba (docker compose, puerto 5433) y corren
// de a un archivo para no pisarse los datos.
export default defineConfig({
  test: {
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
