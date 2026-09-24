/**
 * Escenarios para las pruebas de contrato: preparan datos de la misma forma sobre la base en
 * memoria y sobre PostgreSQL, y entregan los repositorios de cada implementación.
 */
import type { PrismaClient } from '../../src/compartido/infraestructura/prisma.js';
import type {
  RepositorioCuentas,
  RepositorioSesiones,
} from '../../src/modulos/auth/dominio/puertos.js';
import { BuscadorDeUsuariosPrisma } from '../../src/modulos/auth/infraestructura/buscadorDeUsuariosPrisma.js';
import {
  RepositorioCuentasPrisma,
  RepositorioSesionesPrisma,
} from '../../src/modulos/auth/infraestructura/repositoriosPrisma.js';
import type {
  BuscadorDeUsuarios,
  ConsultaDeudas,
  ConsultaViajes,
  RepositorioViajes,
  RetiroDeVotos,
} from '../../src/modulos/viajes/dominio/puertos.js';
import type { EstadoMembresia } from '../../src/modulos/viajes/dominio/viaje.js';
import {
  ConsultaDeudasPrisma,
  ConsultaViajesPrisma,
  RepositorioViajesPrisma,
  RetiroDeVotosPrisma,
} from '../../src/modulos/viajes/infraestructura/prisma.js';
import { vaciarBase } from './baseDePrueba.js';
import {
  baseVacia,
  BuscadorDeUsuariosEnMemoria,
  ConsultaDeudasEnMemoria,
  ConsultaViajesEnMemoria,
  RepositorioCuentasEnMemoria,
  RepositorioSesionesEnMemoria,
  RepositorioViajesEnMemoria,
  RetiroDeVotosEnMemoria,
} from './memoria.js';

export interface Escenario {
  usuario(nombre: string, email?: string): Promise<string>;
  /** Viaje del 2026-12-10 al 2026-12-16 en ARS, con `adminId` como Admin. */
  viaje(adminId: string): Promise<string>;
  miembro(viajeId: string, usuarioId: string, estado?: EstadoMembresia): Promise<void>;
  deuda(viajeId: string, deudorId: string, acreedorId: string, monto: number): Promise<void>;
  /** Crea una propuesta en el estado dado con un voto de `votanteId` y devuelve su id. */
  voto(viajeId: string, votanteId: string, pendiente: boolean): Promise<string>;
  propuestasVotadasPor(usuarioId: string): Promise<string[]>;
}

export interface Repos {
  cuentas: RepositorioCuentas;
  sesiones: RepositorioSesiones;
  viajes: RepositorioViajes;
  consultas: ConsultaViajes;
  deudas: ConsultaDeudas;
  votos: RetiroDeVotos;
  buscador: BuscadorDeUsuarios;
}

export interface Implementacion {
  nombre: string;
  crear(): Promise<{ escenario: Escenario; repos: Repos }>;
}

export const implementacionEnMemoria: Implementacion = {
  nombre: 'en memoria',
  async crear() {
    const base = baseVacia();
    const escenario: Escenario = {
      async usuario(nombre, email) {
        const id = crypto.randomUUID();
        base.usuarios.push({ id, nombre, apodo: null });
        if (email) {
          base.credenciales.push({
            usuarioId: id,
            tipo: 'EMAIL_CONTRASENA',
            identificador: email,
            secretoHash: 'h',
          });
        }
        return id;
      },
      async viaje(adminId) {
        const id = crypto.randomUUID();
        base.viajes.push({
          id,
          nombre: 'Bariloche',
          destino: 'Bariloche',
          fechaInicio: '2026-12-10',
          fechaFin: '2026-12-16',
          monedaCodigo: 'ARS',
          creadoPorId: adminId,
          creadoEn: new Date(),
          membresias: [
            {
              usuarioId: adminId,
              rol: 'ADMIN',
              estado: 'ACTIVA',
              bajaConDeuda: false,
              altaEn: new Date(),
              bajaEn: null,
            },
          ],
        });
        return id;
      },
      async miembro(viajeId, usuarioId, estado = 'ACTIVA') {
        base.viajes
          .find((v) => v.id === viajeId)
          ?.membresias.push({
            usuarioId,
            rol: 'VIAJERO',
            estado,
            bajaConDeuda: false,
            altaEn: new Date(),
            bajaEn: estado === 'ACTIVA' ? null : new Date(),
          });
      },
      async deuda(viajeId, deudorId, acreedorId, monto) {
        base.deudas.push({ viajeId, deudorId, acreedorId, monto });
      },
      async voto(viajeId, votanteId, pendiente) {
        const propuestaId = crypto.randomUUID();
        base.votos.push({ propuestaId, usuarioId: votanteId, viajeId, pendiente });
        return propuestaId;
      },
      async propuestasVotadasPor(usuarioId) {
        return base.votos.filter((v) => v.usuarioId === usuarioId).map((v) => v.propuestaId);
      },
    };
    return {
      escenario,
      repos: {
        cuentas: new RepositorioCuentasEnMemoria(base),
        sesiones: new RepositorioSesionesEnMemoria(base),
        viajes: new RepositorioViajesEnMemoria(base),
        consultas: new ConsultaViajesEnMemoria(base),
        deudas: new ConsultaDeudasEnMemoria(base),
        votos: new RetiroDeVotosEnMemoria(base),
        buscador: new BuscadorDeUsuariosEnMemoria(base),
      },
    };
  },
};

export function implementacionPrisma(prisma: PrismaClient): Implementacion {
  return {
    nombre: 'Prisma',
    async crear() {
      await vaciarBase(prisma);
      await prisma.moneda.create({
        data: { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 },
      });
      const escenario: Escenario = {
        async usuario(nombre, email) {
          const u = await prisma.usuario.create({
            data: {
              nombre,
              ...(email
                ? {
                    credenciales: {
                      create: { tipo: 'EMAIL_CONTRASENA', identificador: email, secretoHash: 'h' },
                    },
                  }
                : {}),
            },
          });
          return u.id;
        },
        async viaje(adminId) {
          const v = await prisma.viaje.create({
            data: {
              nombre: 'Bariloche',
              destino: 'Bariloche',
              fechaInicio: new Date('2026-12-10'),
              fechaFin: new Date('2026-12-16'),
              monedaCodigo: 'ARS',
              creadoPorId: adminId,
              membresias: { create: { usuarioId: adminId, rol: 'ADMIN' } },
            },
          });
          return v.id;
        },
        async miembro(viajeId, usuarioId, estado = 'ACTIVA') {
          await prisma.membresia.create({
            data: {
              viajeId,
              usuarioId,
              rol: 'VIAJERO',
              estado,
              bajaEn: estado === 'ACTIVA' ? null : new Date(),
            },
          });
        },
        async deuda(viajeId, deudorId, acreedorId, monto) {
          await prisma.deuda.create({
            data: { viajeId, deudorId, acreedorId, monto: BigInt(monto) },
          });
        },
        async voto(viajeId, votanteId, pendiente) {
          const p = await prisma.propuesta.create({
            data: {
              viajeId,
              autorId: votanteId,
              tipo: 'ALOJAMIENTO',
              descripcion: 'x',
              ubicacion: 'y',
              estado: pendiente ? 'PENDIENTE' : 'CONFIRMADA',
              votos: { create: { usuarioId: votanteId, valor: 'A_FAVOR' } },
            },
          });
          return p.id;
        },
        async propuestasVotadasPor(usuarioId) {
          return (await prisma.voto.findMany({ where: { usuarioId } })).map((v) => v.propuestaId);
        },
      };
      return {
        escenario,
        repos: {
          cuentas: new RepositorioCuentasPrisma(prisma),
          sesiones: new RepositorioSesionesPrisma(prisma),
          viajes: new RepositorioViajesPrisma(prisma),
          consultas: new ConsultaViajesPrisma(prisma),
          deudas: new ConsultaDeudasPrisma(prisma),
          votos: new RetiroDeVotosPrisma(prisma),
          buscador: new BuscadorDeUsuariosPrisma(prisma),
        },
      };
    },
  };
}
