/** Carga la semilla en la base de `DATABASE_URL` (`npm run db:reset`); los datos están en `semilla.ts`. */
import { crearClientePrisma } from '../src/compartido/infraestructura/prisma.js';
import { cargarCatalogos, cargarEjemplo } from './semilla.js';

try {
  process.loadEnvFile();
} catch {
  // Sin .env se usa el valor por defecto de desarrollo.
}

const prisma = crearClientePrisma(
  process.env['DATABASE_URL'] ?? 'postgresql://viajes:viajes@localhost:5432/viajes',
);

async function main() {
  await cargarCatalogos(prisma);
  if (process.env['NODE_ENV'] === 'test') return;
  if ((await prisma.usuario.count()) > 0) {
    console.log('La base ya tiene usuarios: no se cargan los datos de ejemplo.');
    return;
  }
  await cargarEjemplo(prisma);
  console.log('Datos de ejemplo cargados.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
