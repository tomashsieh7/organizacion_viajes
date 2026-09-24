import { sumarMinutos, type ActividadVista, type EstadoPropuesta } from '@viajes/compartido';
import {
  aFecha,
  aHora,
  deFecha,
  deHora,
} from '../../../compartido/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import { Intervalo } from '../../../compartido/valores/intervalo.js';
import type { RepositorioPropuestas } from '../../propuestas/dominio/puertos.js';
import {
  aVistaPropuesta,
  INCLUIR_VISTA,
  RepositorioPropuestasPrisma,
  type FilaPropuesta,
} from '../../propuestas/infraestructura/prisma.js';
import { Actividad } from '../dominio/actividad.js';
import type { ActividadAgendada } from '../dominio/politicas.js';
import type { ConsultaActividades, RepositorioActividades } from '../dominio/puertos.js';

interface FilaActividad {
  propuestaId: string;
  titulo: string;
  fecha: Date;
  horaInicio: Date;
  duracionMin: number;
  alternativaDeId: string | null;
}

const detalleDe = (a: FilaActividad) => ({
  titulo: a.titulo,
  fecha: aFecha(a.fecha),
  horaInicio: aHora(a.horaInicio),
  duracionMin: a.duracionMin,
  alternativaDeId: a.alternativaDeId,
});

export class RepositorioActividadesPrisma implements RepositorioActividades {
  private readonly propuestas: RepositorioPropuestas;

  constructor(private readonly db: ClientePrisma) {
    this.propuestas = new RepositorioPropuestasPrisma(db);
  }

  async crear(actividad: Actividad): Promise<void> {
    const { votos, ...p } = actividad.propuesta.aDatos();
    const d = actividad.detalle;
    await this.db.propuesta.create({
      data: {
        ...p,
        precio: p.precio === null ? null : BigInt(p.precio),
        actividad: {
          create: {
            titulo: d.titulo,
            fecha: deFecha(d.fecha),
            horaInicio: deHora(d.horaInicio),
            duracionMin: d.duracionMin,
            alternativaDeId: d.alternativaDeId,
          },
        },
      },
    });
  }

  async obtenerParaModificar(viajeId: string, actividadId: string): Promise<Actividad | null> {
    const propuesta = await this.propuestas.obtenerParaModificar(viajeId, actividadId);
    if (!propuesta || propuesta.tipo !== 'ACTIVIDAD') return null;
    const fila = await this.db.actividad.findUniqueOrThrow({ where: { propuestaId: actividadId } });
    return Actividad.reconstruir(propuesta, detalleDe(fila));
  }

  async confirmadas(viajeId: string): Promise<ActividadAgendada[]> {
    const filas = await this.db.actividad.findMany({
      where: { propuesta: { viajeId, estado: 'CONFIRMADA' } },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
    });
    return filas.map((f) => {
      const d = detalleDe(f);
      return {
        id: f.propuestaId,
        titulo: d.titulo,
        fecha: d.fecha,
        horaInicio: d.horaInicio,
        duracionMin: d.duracionMin,
        intervalo: Intervalo.deActividad(d.fecha, d.horaInicio, d.duracionMin),
      };
    });
  }

  async opcionesDelGrupo(viajeId: string, grupoId: string): Promise<Actividad[]> {
    const filas = await this.db.actividad.findMany({
      where: {
        propuesta: { viajeId },
        OR: [{ propuestaId: grupoId }, { alternativaDeId: grupoId }],
      },
      select: { propuestaId: true },
      orderBy: { propuestaId: 'asc' },
    });
    const opciones: Actividad[] = [];
    for (const f of filas) {
      const a = await this.obtenerParaModificar(viajeId, f.propuestaId);
      if (a) opciones.push(a);
    }
    return opciones;
  }

  async bloquearAgenda(viajeId: string): Promise<void> {
    await this.db.$queryRaw`SELECT id FROM viaje WHERE id = ${viajeId}::uuid FOR UPDATE`;
  }
}

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
