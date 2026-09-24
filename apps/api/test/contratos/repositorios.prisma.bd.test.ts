import { afterAll } from 'vitest';
import { clienteDePrueba } from '../soporte/baseDePrueba.js';
import { implementacionPrisma } from '../soporte/escenarios.js';
import { probarContratosDeRepositorios } from './repositorios.contrato.js';

const prisma = clienteDePrueba();
afterAll(() => prisma.$disconnect());

probarContratosDeRepositorios(implementacionPrisma(prisma));
