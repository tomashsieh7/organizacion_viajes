import { diasEntre } from '@viajes/compartido';
import { deFecha } from '../../../comun/infraestructura/conversiones.js';
import {
  esViolacionDeUnicidad,
  type ClientePrisma,
} from '../../../comun/infraestructura/clientePrisma.js';
import { propuestaExistente, type Propuesta } from '../../propuestas/dominio/propuesta.js';
import type { DetalleAlojamiento, RepositorioAlojamientos } from '../dominio/puertos.js';

export class RepositorioAlojamientosPrisma implements RepositorioAlojamientos {
  constructor(private readonly db: ClientePrisma) {}

  async crear(propuesta: Propuesta, detalle: DetalleAlojamiento): Promise<void> {
    const { votos, ...p } = propuesta.aDatos();
    try {
      await this.db.propuesta.create({
        data: {
          ...p,
          precio: p.precio === null ? null : BigInt(p.precio),
          alojamiento: {
            create: {
              nombre: detalle.nombre,
              fechaDesde: detalle.estadia ? deFecha(detalle.estadia.desde) : null,
              fechaHasta: detalle.estadia ? deFecha(detalle.estadia.hasta) : null,
              noches: detalle.estadia
                ? diasEntre(detalle.estadia.desde, detalle.estadia.hasta)
                : (detalle.noches ?? 0),
            },
          },
        },
      });
    } catch (error) {
      if (esViolacionDeUnicidad(error)) {
        throw propuestaExistente();
      }
      throw error;
    }
  }
}
