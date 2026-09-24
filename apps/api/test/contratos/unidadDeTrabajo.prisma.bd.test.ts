import { afterAll } from 'vitest';
import { UnidadDeTrabajoPrisma } from '../../src/compartido/infraestructura/unidadDeTrabajoPrisma.js';
import { clienteDePrueba, vaciarBase } from '../soporte/baseDePrueba.js';
import {
  probarContratoUnidadDeTrabajo,
  type RepositorioDeNotas,
} from './unidadDeTrabajo.contrato.js';

// Las notas se guardan como categorías de gasto: sirve cualquier tabla sin claves foráneas.
const prisma = clienteDePrueba();
afterAll(() => prisma.$disconnect());

probarContratoUnidadDeTrabajo('Prisma', {
  async crear() {
    await vaciarBase(prisma);
    const unidad = new UnidadDeTrabajoPrisma<RepositorioDeNotas>(prisma, (tx) => ({
      agregar: async (texto) => {
        await tx.categoriaGasto.create({ data: { codigo: texto, nombre: texto } });
      },
      listar: async () => (await tx.categoriaGasto.findMany()).map((c) => c.codigo),
    }));
    const leerConfirmado = async () =>
      (await prisma.categoriaGasto.findMany()).map((c) => c.codigo);
    return { unidad, leerConfirmado };
  },
});
