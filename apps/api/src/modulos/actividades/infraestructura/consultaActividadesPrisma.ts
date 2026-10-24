import { sumarMinutos, type ActividadVista, type EstadoPropuesta } from '@viajes/compartido';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import {
  aVistaPropuesta,
  INCLUIR_VISTA,
  type FilaPropuesta,
} from '../../propuestas/infraestructura/vistaPropuesta.js';
import type { ConsultaActividades } from '../dominio/puertos.js';
import { detalleDe, type FilaActividad } from './filasPrisma.js';

const INCLUIR = {
  ...INCLUIR_VISTA,
  actividad: { include: { alternativaDe: { select: { propuestaId: true, titulo: true } } } },
} as const;

type FilaConActividad = FilaPropuesta & {
  actividad:
    (FilaActividad & { alternativaDe: { propuestaId: string; titulo: string } | null }) | null;
};

function aVista(f: FilaConActividad, usuarioId: string): ActividadVista | null {
  if (!f.actividad) return null;
  const d = detalleDe(f.actividad);
  return {
    ...aVistaPropuesta(f, usuarioId),
    tipo: 'ACTIVIDAD',
    fechaCambiadaEn: d.fechaCambiadaEn?.toISOString() ?? null,
    actividad: {
      titulo: d.titulo,
      fecha: d.fecha,
      horaInicio: d.horaInicio,
      horaFin: sumarMinutos(d.horaInicio, d.duracionMin),
      duracionMin: d.duracionMin,
      alternativaDe: f.actividad.alternativaDe
        ? { id: f.actividad.alternativaDe.propuestaId, titulo: f.actividad.alternativaDe.titulo }
        : null,
    },
  };
}

export class ConsultaActividadesPrisma implements ConsultaActividades {
  constructor(private readonly db: ClientePrisma) {}

  async listar(
    viajeId: string,
    usuarioId: string,
    estado?: EstadoPropuesta,
  ): Promise<ActividadVista[]> {
    const filas = await this.db.propuesta.findMany({
      where: { viajeId, tipo: 'ACTIVIDAD', ...(estado ? { estado } : {}) },
      include: INCLUIR,
      orderBy: [
        { actividad: { fecha: 'asc' } },
        { actividad: { horaInicio: 'asc' } },
        { creadaEn: 'asc' },
      ],
    });
    return filas.flatMap((f) => aVista(f, usuarioId) ?? []);
  }

  async obtener(
    viajeId: string,
    actividadId: string,
    usuarioId: string,
  ): Promise<ActividadVista | null> {
    const f = await this.db.propuesta.findFirst({
      where: { id: actividadId, viajeId, tipo: 'ACTIVIDAD' },
      include: INCLUIR,
    });
    return f ? aVista(f, usuarioId) : null;
  }
}
