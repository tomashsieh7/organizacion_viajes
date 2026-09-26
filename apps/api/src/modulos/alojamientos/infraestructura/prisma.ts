import type { AlojamientoVista, EstadoPropuesta } from '@viajes/compartido';
import { aFecha, deFecha } from '../../../compartido/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import type { Propuesta } from '../../propuestas/dominio/propuesta.js';
import {
  aVistaPropuesta,
  INCLUIR_VISTA,
  type FilaPropuesta,
} from '../../propuestas/infraestructura/vistaPropuesta.js';
import type {
  ConsultaAlojamientos,
  DetalleAlojamiento,
  RepositorioAlojamientos,
} from '../dominio/puertos.js';

export class RepositorioAlojamientosPrisma implements RepositorioAlojamientos {
  constructor(private readonly db: ClientePrisma) {}

  async crear(propuesta: Propuesta, detalle: DetalleAlojamiento): Promise<void> {
    const { votos, ...p } = propuesta.aDatos();
    await this.db.propuesta.create({
      data: {
        ...p,
        precio: p.precio === null ? null : BigInt(p.precio),
        alojamiento: {
          create: {
            nombre: detalle.nombre,
            fechaDesde: deFecha(detalle.estadia.desde),
            fechaHasta: deFecha(detalle.estadia.hasta),
          },
        },
      },
    });
  }
}

const INCLUIR = { ...INCLUIR_VISTA, alojamiento: true } as const;

function aVista(
  f: FilaPropuesta & { alojamiento: { nombre: string; fechaDesde: Date; fechaHasta: Date } | null },
  usuarioId: string,
): AlojamientoVista | null {
  if (!f.alojamiento) return null;
  return {
    ...aVistaPropuesta(f, usuarioId),
    tipo: 'ALOJAMIENTO',
    alojamiento: {
      nombre: f.alojamiento.nombre,
      fechaDesde: aFecha(f.alojamiento.fechaDesde),
      fechaHasta: aFecha(f.alojamiento.fechaHasta),
    },
  };
}

export class ConsultaAlojamientosPrisma implements ConsultaAlojamientos {
  constructor(private readonly db: ClientePrisma) {}

  async listar(
    viajeId: string,
    usuarioId: string,
    estado?: EstadoPropuesta,
  ): Promise<AlojamientoVista[]> {
    const filas = await this.db.propuesta.findMany({
      where: { viajeId, tipo: 'ALOJAMIENTO', ...(estado ? { estado } : {}) },
      include: INCLUIR,
      orderBy: [{ alojamiento: { fechaDesde: 'asc' } }, { creadaEn: 'asc' }],
    });
    return filas.flatMap((f) => aVista(f, usuarioId) ?? []);
  }

  async obtener(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<AlojamientoVista | null> {
    const f = await this.db.propuesta.findFirst({
      where: { id: propuestaId, viajeId, tipo: 'ALOJAMIENTO' },
      include: INCLUIR,
    });
    return f ? aVista(f, usuarioId) : null;
  }
}
