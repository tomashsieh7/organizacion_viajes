import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generado/prisma/client.js';

export type { PrismaClient };

/** Cliente de Prisma dentro de una transacción interactiva. */
export type ClienteTransaccional = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export function crearClientePrisma(url: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
