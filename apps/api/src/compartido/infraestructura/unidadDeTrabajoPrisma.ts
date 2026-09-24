import type { UnidadDeTrabajo } from '../unidadDeTrabajo.js';
import type { ClienteTransaccional, PrismaClient } from './prisma.js';

/**
 * Implementación de `UnidadDeTrabajo` con una transacción interactiva de Prisma (Adapter).
 * `crearRepositorios` arma los repositorios sobre el cliente transaccional, así todo lo que
 * hacen queda dentro de la misma transacción.
 */
export class UnidadDeTrabajoPrisma<R> implements UnidadDeTrabajo<R> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly crearRepositorios: (tx: ClienteTransaccional) => R,
  ) {}

  ejecutar<T>(trabajo: (repositorios: R) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => trabajo(this.crearRepositorios(tx)));
  }
}
