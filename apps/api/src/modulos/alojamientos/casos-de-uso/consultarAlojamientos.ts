import type { AlojamientoVista, EstadoPropuesta } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaAlojamientos } from '../dominio/puertos.js';

export class ConsultarAlojamientos {
  constructor(private readonly consultas: ConsultaAlojamientos) {}

  listar(
    viajeId: string,
    usuarioId: string,
    estado?: EstadoPropuesta,
  ): Promise<AlojamientoVista[]> {
    return this.consultas.listar(viajeId, usuarioId, estado);
  }

  async obtener(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<AlojamientoVista> {
    const a = await this.consultas.obtener(viajeId, propuestaId, usuarioId);
    if (!a) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El alojamiento no existe');
    return a;
  }
}
