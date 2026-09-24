import {
  crearClientePrisma,
  type PrismaClient,
} from '../../src/compartido/infraestructura/prisma.js';

export const URL_BASE_DE_PRUEBA =
  process.env['DATABASE_URL_TEST'] ?? 'postgresql://viajes:viajes@localhost:5433/viajes_test';

export function clienteDePrueba(): PrismaClient {
  return crearClientePrisma(URL_BASE_DE_PRUEBA);
}

/** Vacía todas las tablas de la base de prueba. */
export async function vaciarBase(prisma: PrismaClient): Promise<void> {
  const tablas = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const lista = tablas.map((t) => `"${t.tablename}"`).join(', ');
  if (lista) await prisma.$executeRawUnsafe(`TRUNCATE ${lista} CASCADE`);
}
