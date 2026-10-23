import { aFecha } from '../../../comun/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import type { ConsultaFechasDeViaje } from '../dominio/puertos.js';

export class ConsultaFechasDeViajePrisma implements ConsultaFechasDeViaje {
  constructor(private readonly db: ClientePrisma) {}

  async rango(viajeId: string): Promise<RangoFechas | null> {
    const [v] = await this.db.$queryRaw<{ fecha_inicio: Date; fecha_fin: Date }[]>`
      SELECT fecha_inicio, fecha_fin FROM viaje WHERE id = ${viajeId}::uuid FOR SHARE`;
    return v ? RangoFechas.crear(aFecha(v.fecha_inicio), aFecha(v.fecha_fin)) : null;
  }
}
