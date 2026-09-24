import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RAIZ = fileURLToPath(new URL('../../../../', import.meta.url));

function archivosDePrueba(carpeta: string): string[] {
  let archivos: string[] = [];
  try {
    for (const nombre of readdirSync(carpeta)) {
      const ruta = join(carpeta, nombre);
      if (statSync(ruta).isDirectory()) archivos = archivos.concat(archivosDePrueba(ruta));
      else if (/\.ts$/.test(nombre)) archivos.push(ruta);
    }
  } catch {
    // Una carpeta que no existe no aporta pruebas.
  }
  return archivos;
}

/** Títulos de `describe`, `it` y `test` de las pruebas del backend, del frontend y de punta a punta. */
function titulosDePrueba(): string {
  const carpetas = ['apps/api/test', 'apps/web/test', 'e2e'].map((c) => join(RAIZ, c));
  const titulo = /\b(?:it|test|describe)(?:\.\w+)?\(\s*(['`"])([\s\S]*?)\1/g;
  return carpetas
    .flatMap(archivosDePrueba)
    .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(titulo)].map((m) => m[2]))
    .join('\n');
}

/** Si el identificador aparece en un título, solo o dentro de un rango como "RN-G1 a RN-G6". */
function aparece(id: string, titulos: string): boolean {
  if (new RegExp(`${id}(?!\\d)`).test(titulos)) return true;
  const [, prefijo, numero] = /^(CU|RN-[A-Z]+)(\d+)$/.exec(id)!;
  const rango = new RegExp(`${prefijo}(\\d+) a ${prefijo}(\\d+)`, 'g');
  return [...titulos.matchAll(rango)].some(
    ([, desde, hasta]) => Number(desde) <= Number(numero) && Number(numero) <= Number(hasta),
  );
}

describe('Trazabilidad (criterio de terminado de F9)', () => {
  const plan = readFileSync(join(RAIZ, 'PLAN.md'), 'utf8');
  const seccion = (desde: string, hasta: string) =>
    plan.slice(plan.indexOf(desde), plan.indexOf(hasta));
  const casos = [...seccion('## 1.', '## 2.').matchAll(/\|\s*(CU\d\d)\s*\|/g)].map((m) => m[1]!);
  const reglas = [...seccion('## 6.', '## 7.').matchAll(/\|\s*(RN-[A-Z]+\d+)\s*\|/g)].map(
    (m) => m[1]!,
  );

  it('lee los 26 casos de uso de la sección 1 y las reglas de la sección 6', () => {
    expect(new Set(casos).size).toBe(26);
    expect(reglas.length).toBeGreaterThan(50);
  });

  it('cada caso de uso y cada regla aparece en el nombre de al menos una prueba', () => {
    const titulos = titulosDePrueba();
    const faltan = [...new Set([...casos, ...reglas])].filter((id) => !aparece(id, titulos));
    expect(faltan).toEqual([]);
  });
});
