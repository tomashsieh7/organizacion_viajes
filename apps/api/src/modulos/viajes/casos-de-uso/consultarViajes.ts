import type { DetalleViaje, Moneda, Participante, ResumenViaje } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaDeudas, ConsultaViajes } from '../dominio/puertos.js';
import { noEncontrado } from './modificarViaje.js';

/** Lecturas de viajes, participantes y monedas. */
export class ConsultarViajes {
  constructor(
    private readonly consultas: Pick<
      ConsultaViajes,
      | 'listarDeUsuario'
      | 'obtenerDetalle'
      | 'listarParticipantes'
      | 'obtenerParticipante'
      | 'listarMonedas'
    >,
    private readonly deudas: ConsultaDeudas,
  ) {}

  listarMisViajes(usuarioId: string): Promise<ResumenViaje[]> {
    return this.consultas.listarDeUsuario(usuarioId);
  }

  async detalle(viajeId: string, usuarioId: string): Promise<DetalleViaje> {
    const detalle = await this.consultas.obtenerDetalle(viajeId, usuarioId);
    if (!detalle) throw noEncontrado();
    return { ...detalle, miDeudaPendiente: await this.deudas.totalAdeudado(viajeId, usuarioId) };
  }

  participantes(viajeId: string): Promise<Participante[]> {
    return this.consultas.listarParticipantes(viajeId);
  }

  async participante(viajeId: string, usuarioId: string): Promise<Participante> {
    const p = await this.consultas.obtenerParticipante(viajeId, usuarioId);
    if (!p)
      throw new ErrorDeDominio(
        'NO_ENCONTRADO',
        'NO_ENCONTRADO',
        'Esa persona no participa del viaje',
      );
    return p;
  }

  monedas(): Promise<Moneda[]> {
    return this.consultas.listarMonedas();
  }
}
