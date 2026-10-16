import type { ActividadVista, EstadoPropuesta } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaActividades } from '../dominio/puertos.js';

/** Listado y CU18. */
export class ConsultarActividades {
  constructor(private readonly consultas: ConsultaActividades) {}

  listar(viajeId: string, usuarioId: string, estado?: EstadoPropuesta): Promise<ActividadVista[]> {
    return this.consultas.listar(viajeId, usuarioId, estado);
  }

  async obtener(viajeId: string, actividadId: string, usuarioId: string): Promise<ActividadVista> {
    const a = await this.consultas.obtener(viajeId, actividadId, usuarioId);
    if (!a) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'La actividad no existe');
    return a;
  }
}
