import { aFecha } from '../../../comun/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import type { ConsultaFechasDeViaje } from '../dominio/puertos.js';

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
