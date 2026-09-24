import { expect } from 'vitest';
import type { PrismaClient } from '../../src/compartido/infraestructura/prisma.js';

interface Movimiento {
  viaje_id: string;
  deudor: string;
  acreedor: string;
  monto: bigint;
}

/** Saldo neto de `a` con `b` (positivo si `a` le debe a `b`), por viaje y par ordenado. */
function netos(filas: Movimiento[]): Map<string, bigint> {
  const netos = new Map<string, bigint>();
  for (const f of filas) {
    const [a, b, signo] =
      f.deudor < f.acreedor ? [f.deudor, f.acreedor, 1n] : [f.acreedor, f.deudor, -1n];
    const clave = `${f.viaje_id}:${a}:${b}`;
    netos.set(clave, (netos.get(clave) ?? 0n) + signo * f.monto);
  }
  for (const [clave, valor] of netos) if (valor === 0n) netos.delete(clave);
  return netos;
}

/**
 * Invariante de la sección 4 de PLAN.md: para cada par de viajeros, el saldo neto guardado en
 * `deuda` es igual al que resulta de las partes de los gastos y de los pagos. Además, entre dos
 * viajeros queda una sola deuda con saldo (P15) y ningún saldo es negativo.
 */
export async function verificarInvarianteDeSaldos(prisma: PrismaClient): Promise<void> {
  const calculados = await prisma.$queryRaw<Movimiento[]>`
    SELECT g.viaje_id, p.usuario_id AS deudor, g.pagado_por_id AS acreedor, p.monto
    FROM gasto_parte p JOIN gasto g ON g.id = p.gasto_id
    WHERE p.usuario_id <> g.pagado_por_id
    UNION ALL
    SELECT d.viaje_id, d.deudor_id, d.acreedor_id, -pg.monto
    FROM pago pg JOIN deuda d ON d.id = pg.deuda_id`;
  const guardados = await prisma.$queryRaw<Movimiento[]>`
    SELECT viaje_id, deudor_id AS deudor, acreedor_id AS acreedor, monto FROM deuda`;
  expect(netos(guardados)).toEqual(netos(calculados));

  expect(guardados.filter((d) => d.monto < 0n)).toEqual([]);
  const conSaldo = guardados.filter((d) => d.monto > 0n);
  const dobles = conSaldo.filter((d) =>
    conSaldo.some(
      (o) => o.viaje_id === d.viaje_id && o.deudor === d.acreedor && o.acreedor === d.deudor,
    ),
  );
  expect(dobles).toEqual([]);
}
