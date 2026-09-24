import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** `globalSetup` de Playwright: corre la preparación de la base con tsx, que resuelve el código de la API. */
export default function prepararTodo(): void {
  try {
    execSync('npx tsx e2e/soporte/prepararBase.ts', {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      stdio: 'pipe',
    });
  } catch (error) {
    const salida = String((error as { stderr?: Buffer }).stderr ?? error);
    throw new Error(
      `No se pudo preparar la base de punta a punta. ¿Está levantada con "docker compose up -d"?\n${salida}`,
      { cause: error },
    );
  }
}
