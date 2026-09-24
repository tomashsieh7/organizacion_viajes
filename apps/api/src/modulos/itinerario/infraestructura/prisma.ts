import { sumarMinutos, type ActividadDelItinerario } from '@viajes/compartido';
import { aFecha, aHora } from '../../../compartido/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import { RangoFechas } from '../../../compartido/valores/rangoFechas.js';
import type { AlojamientoConfirmado, ConsultaItinerario } from '../dominio/puertos.js';

export class ConsultaItinerarioPrisma implements ConsultaItinerario {
  constructor(private readonly db: ClientePrisma) {}

  async actividadesConfirmadas(viajeId: string): Promise<ActividadDelItinerario[]> {
    const filas = await this.db.actividad.findMany({
      where: { propuesta: { viajeId, estado: 'CONFIRMADA' } },
      include: { propuesta: true },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }, { titulo: 'asc' }],
    });
    return filas.map((f) => {
      const horaInicio = aHora(f.horaInicio);
      return {
        id: f.propuestaId,
        titulo: f.titulo,
        descripcion: f.propuesta.descripcion,
        fecha: aFecha(f.fecha),
        horaInicio,
        horaFin: sumarMinutos(horaInicio, f.duracionMin),
        duracionMin: f.duracionMin,
        ubicacion: f.propuesta.ubicacion,
        // Las actividades siempre tienen coordenadas (P8); la columna es opcional por los alojamientos.
        latitud: f.propuesta.latitud ?? 0,
        longitud: f.propuesta.longitud ?? 0,
      };
    });
  }

  async alojamientosConfirmados(viajeId: string): Promise<AlojamientoConfirmado[]> {
    const filas = await this.db.alojamiento.findMany({
      where: { propuesta: { viajeId, estado: 'CONFIRMADA' } },
      include: { propuesta: true },
      orderBy: [{ fechaDesde: 'asc' }, { nombre: 'asc' }],
    });
    return filas.map((f) => ({
      id: f.propuestaId,
      nombre: f.nombre,
      ubicacion: f.propuesta.ubicacion,
      estadia: RangoFechas.crear(aFecha(f.fechaDesde), aFecha(f.fechaHasta)),
    }));
  }
}
