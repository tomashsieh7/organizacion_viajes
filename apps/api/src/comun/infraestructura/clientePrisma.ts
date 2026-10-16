import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generado/prisma/client.js';

export type { PrismaClient };

/** Cliente de Prisma dentro de una transacción interactiva. */
export type ClienteTransaccional = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/** Cliente con el que trabajan los repositorios: el normal o el de una transacción. */
export type ClientePrisma = PrismaClient | ClienteTransaccional;

export function crearClientePrisma(url: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/** Si el error de Prisma corresponde a una restricción UNIQUE violada. */
export function esViolacionDeUnicidad(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'
  );
}
