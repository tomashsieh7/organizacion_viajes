import { afterAll, describe, expect, it } from 'vitest';
import { cargarCatalogos, cargarEjemplo } from '../../prisma/semilla.js';
import { clienteDePrueba, vaciarBase } from '../soporte/baseDePrueba.js';
import { verificarInvarianteDeSaldos } from '../soporte/invarianteSaldos.js';

const prisma = clienteDePrueba();
afterAll(() => prisma.$disconnect());

describe('Invariante de saldos sobre la semilla', () => {
  it('las deudas de la semilla coinciden con sus gastos y pagos', async () => {
    await vaciarBase(prisma);
    await cargarCatalogos(prisma);
    await cargarEjemplo(prisma);
    await verificarInvarianteDeSaldos(prisma);
  });

  it('detecta una deuda que no coincide con sus movimientos', async () => {
    const deuda = await prisma.deuda.findFirstOrThrow({ where: { monto: { gt: 0 } } });
    await prisma.deuda.update({ where: { id: deuda.id }, data: { monto: deuda.monto + 1n } });
    await expect(verificarInvarianteDeSaldos(prisma)).rejects.toThrow();
  });
});
