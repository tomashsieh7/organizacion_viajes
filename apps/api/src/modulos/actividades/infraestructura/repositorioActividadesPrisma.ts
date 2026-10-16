import { deFecha, deHora } from '../../../comun/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { Intervalo } from '../../../comun/valores/intervalo.js';
import type { RepositorioPropuestas } from '../../propuestas/dominio/puertos.js';
import { Actividad } from '../dominio/actividad.js';
import type { ActividadAgendada } from '../dominio/politicas.js';
import type { RepositorioActividades } from '../dominio/puertos.js';
import { detalleDe } from './filasPrisma.js';

export class RepositorioActividadesPrisma implements RepositorioActividades {
  constructor(
    private readonly db: ClientePrisma,
    private readonly propuestas: RepositorioPropuestas,
  ) {}

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
