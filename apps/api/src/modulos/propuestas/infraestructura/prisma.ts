import type { PropuestaVista } from '@viajes/compartido';
import { aFecha, aMonto } from '../../../compartido/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import { RangoFechas } from '../../../compartido/valores/rangoFechas.js';
import { Propuesta } from '../dominio/propuesta.js';
import type {
  ConsultaFechasDeViaje,
  ConsultaPropuestas,
  RepositorioPropuestas,
} from '../dominio/puertos.js';

/** Fila de propuesta con lo necesario para armar la vista común. */
export interface FilaPropuesta {
  id: string;
  tipo: 'ACTIVIDAD' | 'ALOJAMIENTO';
  estado: PropuestaVista['estado'];
  descripcion: string;
  precio: bigint | null;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  creadaEn: Date;
  resueltaEn: Date | null;
  autor: { id: string; nombre: string };
  votos: { usuarioId: string; valor: 'A_FAVOR' | 'EN_CONTRA' }[];
}

export const INCLUIR_VISTA = { autor: true, votos: true } as const;

/** Arma la vista común de una propuesta; la usan los módulos de cada tipo para sus listados. */
export function aVistaPropuesta(p: FilaPropuesta, usuarioId: string): PropuestaVista {
  return {
    id: p.id,
    tipo: p.tipo,
    estado: p.estado,
    descripcion: p.descripcion,
    precio: p.precio === null ? null : aMonto(p.precio),
    ubicacion: p.ubicacion,
    latitud: p.latitud,
    longitud: p.longitud,
    autor: { usuarioId: p.autor.id, nombre: p.autor.nombre },
    votosAFavor: p.votos.filter((v) => v.valor === 'A_FAVOR').length,
    votosEnContra: p.votos.filter((v) => v.valor === 'EN_CONTRA').length,
    miVoto: p.votos.find((v) => v.usuarioId === usuarioId)?.valor ?? null,
    creadaEn: p.creadaEn.toISOString(),
    resueltaEn: p.resueltaEn?.toISOString() ?? null,
  };
}

export class RepositorioPropuestasPrisma implements RepositorioPropuestas {
  constructor(private readonly db: ClientePrisma) {}

  async obtenerParaModificar(viajeId: string, propuestaId: string): Promise<Propuesta | null> {
    const bloqueada = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM propuesta WHERE id = ${propuestaId}::uuid AND viaje_id = ${viajeId}::uuid FOR UPDATE`;
    if (bloqueada.length === 0) return null;
    const p = await this.db.propuesta.findUniqueOrThrow({
      where: { id: propuestaId },
      include: { votos: true },
    });
    return Propuesta.reconstruir({
      id: p.id,
      viajeId: p.viajeId,
      autorId: p.autorId,
      tipo: p.tipo,
      descripcion: p.descripcion,
      precio: p.precio === null ? null : aMonto(p.precio),
      ubicacion: p.ubicacion,
      latitud: p.latitud,
      longitud: p.longitud,
      estado: p.estado,
      resueltaPorId: p.resueltaPorId,
      resueltaEn: p.resueltaEn,
      creadaEn: p.creadaEn,
      votos: p.votos.map((v) => ({
        usuarioId: v.usuarioId,
        valor: v.valor,
        emitidoEn: v.emitidoEn,
      })),
    });
  }

  async guardar(propuesta: Propuesta): Promise<void> {
    const { votos, ...p } = propuesta.aDatos();
    const cambios = {
      descripcion: p.descripcion,
      precio: p.precio === null ? null : BigInt(p.precio),
      ubicacion: p.ubicacion,
      latitud: p.latitud,
      longitud: p.longitud,
      estado: p.estado,
      resueltaPorId: p.resueltaPorId,
      resueltaEn: p.resueltaEn,
    };
    await this.db.propuesta.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        viajeId: p.viajeId,
        autorId: p.autorId,
        tipo: p.tipo,
        creadaEn: p.creadaEn,
        ...cambios,
      },
      update: cambios,
    });
    await this.db.voto.deleteMany({
      where: { propuestaId: p.id, usuarioId: { notIn: votos.map((v) => v.usuarioId) } },
    });
    for (const v of votos) {
      await this.db.voto.upsert({
        where: { propuestaId_usuarioId: { propuestaId: p.id, usuarioId: v.usuarioId } },
        create: {
          propuestaId: p.id,
          usuarioId: v.usuarioId,
          valor: v.valor,
          emitidoEn: v.emitidoEn,
        },
        update: { valor: v.valor, emitidoEn: v.emitidoEn },
      });
    }
  }
}

export class ConsultaPropuestasPrisma implements ConsultaPropuestas {
  constructor(private readonly db: ClientePrisma) {}

  async obtenerVista(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<PropuestaVista | null> {
    const p = await this.db.propuesta.findFirst({
      where: { id: propuestaId, viajeId },
      include: INCLUIR_VISTA,
    });
    return p ? aVistaPropuesta(p, usuarioId) : null;
  }
}

export class ConsultaFechasDeViajePrisma implements ConsultaFechasDeViaje {
  constructor(private readonly db: ClientePrisma) {}

  async rango(viajeId: string): Promise<RangoFechas | null> {
    const v = await this.db.viaje.findUnique({
      where: { id: viajeId },
      select: { fechaInicio: true, fechaFin: true },
    });
    return v ? RangoFechas.crear(aFecha(v.fechaInicio), aFecha(v.fechaFin)) : null;
  }
}
