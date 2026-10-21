import { ErrorDeDominio } from '../../../comun/errores.js';
import { deFecha } from '../../../comun/infraestructura/conversiones.js';
import {
  esViolacionDeUnicidad,
  type ClientePrisma,
} from '../../../comun/infraestructura/clientePrisma.js';
import type { Propuesta } from '../../propuestas/dominio/propuesta.js';
import type {
  DetalleAlojamiento,
  OrigenDePropuesta,
  RepositorioAlojamientos,
} from '../dominio/puertos.js';

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
        throw new ErrorDeDominio(
          'CONFLICTO',
          'PROPUESTA_EXISTENTE',
          'Ya existe una propuesta con ese id',
        );
      }
      throw error;
    }
  }

  origen(propuestaId: string): Promise<OrigenDePropuesta | null> {
    return this.db.propuesta.findUnique({
      where: { id: propuestaId },
      select: { viajeId: true, autorId: true, tipo: true },
    });
  }
}
