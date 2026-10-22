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
              fechaDesde: deFecha(detalle.estadia.desde),
              fechaHasta: deFecha(detalle.estadia.hasta),
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
