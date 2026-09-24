import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile();
} catch {
  // Sin .env se usan las variables del entorno o el valor por defecto de desarrollo.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://viajes:viajes@localhost:5432/viajes',
  },
});
