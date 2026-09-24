/**
 * Prepara la base de las pruebas de punta a punta: la crea si no existe, aplica las migraciones,
 * la vacía y carga los catálogos (monedas y categorías). Se ejecuta con tsx desde `globalSetup`,
 * antes de que Playwright levante la API.
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { cargarCatalogos } from '../../apps/api/prisma/semilla.js';
import { crearClientePrisma } from '../../apps/api/src/compartido/infraestructura/prisma.js';
import { URL_BASE_E2E } from './constantes.js';

const url = new URL(URL_BASE_E2E);
const nombre = url.pathname.slice(1);
// Se conecta a la base de prueba del mismo servidor para crear la de punta a punta.
const administracion = new pg.Client({
  connectionString: URL_BASE_E2E.replace(/\/[^/]+$/, '/viajes_test'),
});
await administracion.connect();
const existe = await administracion.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombre]);
if (existe.rowCount === 0) await administracion.query(`CREATE DATABASE "${nombre}"`);
await administracion.end();

execSync('npx prisma migrate deploy', {
  cwd: fileURLToPath(new URL('../../apps/api/', import.meta.url)),
  stdio: 'pipe',
  env: { ...process.env, DATABASE_URL: URL_BASE_E2E },
});

const prisma = crearClientePrisma(URL_BASE_E2E);
const tablas = await prisma.$queryRaw<{ tablename: string }[]>`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
await prisma.$executeRawUnsafe(
  `TRUNCATE ${tablas.map((t) => `"${t.tablename}"`).join(', ')} CASCADE`,
);
await cargarCatalogos(prisma);
await prisma.$disconnect();
