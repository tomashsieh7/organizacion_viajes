import { aFecha, aMonto, deFecha } from '../../../comun/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import { Actividad } from '../../actividades/dominio/actividad.js';
import { detalleDe } from '../../actividades/infraestructura/filasPrisma.js';
import { Alojamiento } from '../../alojamientos/dominio/alojamiento.js';
import { Propuesta } from '../../propuestas/dominio/propuesta.js';
import type { AgendaDelViaje } from '../dominio/puertos.js';
import type { PropuestaReacomodable } from '../dominio/reacomodo.js';

export class AgendaDelViajePrisma implements AgendaDelViaje {
  constructor(private readonly db: ClientePrisma) {}

  async propuestas(viajeId: string): Promise<PropuestaReacomodable[]> {
    const filas = await this.db.propuesta.findMany({
      where: { viajeId },
      include: { votos: true, actividad: true, alojamiento: true },
      orderBy: { id: 'asc' },
    });
    return filas.flatMap((p): PropuestaReacomodable[] => {
      const propuesta = Propuesta.reconstruir({
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
        votos: p.votos.map(({ usuarioId, valor, emitidoEn }) => ({ usuarioId, valor, emitidoEn })),
      });
      if (p.actividad) return [Actividad.reconstruir(propuesta, detalleDe(p.actividad))];
      if (p.alojamiento) {
        return [
          Alojamiento.reconstruir(propuesta, {
            nombre: p.alojamiento.nombre,
            noches: p.alojamiento.noches,
            fechaCambiadaEn: p.alojamiento.fechaCambiadaEn,
            estadia:
              p.alojamiento.fechaDesde && p.alojamiento.fechaHasta
                ? RangoFechas.crear(
                    aFecha(p.alojamiento.fechaDesde),
                    aFecha(p.alojamiento.fechaHasta),
                  )
                : null,
          }),
        ];
      }
      return [];
    });
  }

  async guardar(movidas: PropuestaReacomodable[]): Promise<void> {
    for (const p of movidas) {
      if (p instanceof Actividad) {
        await this.db.actividad.update({
          where: { propuestaId: p.id },
          data: {
            fecha: p.dias ? deFecha(p.dias.desde) : null,
            fechaCambiadaEn: p.detalle.fechaCambiadaEn ?? null,
          },
        });
      } else if (p instanceof Alojamiento) {
        await this.db.alojamiento.update({
          where: { propuestaId: p.id },
          data: {
            fechaDesde: p.dias ? deFecha(p.dias.desde) : null,
            fechaHasta: p.dias ? deFecha(p.dias.hasta) : null,
            noches: p.noches,
            fechaCambiadaEn: p.fechaCambiadaEn,
          },
        });
      }
    }
  }
}
