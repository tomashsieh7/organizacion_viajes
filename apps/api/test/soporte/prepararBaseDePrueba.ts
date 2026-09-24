import { execSync } from 'node:child_process';
import { URL_BASE_DE_PRUEBA } from './baseDePrueba.js';

/**
 * Setup global del proyecto de pruebas con base: aplica las migraciones pendientes a la base de
 * prueba. No la resetea; cada archivo de pruebas vacía las tablas que usa.
 */
export default function prepararBaseDePrueba(): void {
  execSync('npx prisma migrate deploy', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: URL_BASE_DE_PRUEBA },
  });
}
