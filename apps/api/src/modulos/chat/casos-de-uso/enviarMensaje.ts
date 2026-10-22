import type { MensajeVista } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Reloj } from '../../../comun/reloj.js';
import { Mensaje, mensajeExistente } from '../dominio/mensaje.js';
import type {
  ConsultaMensajes,
  ConsultaParticipacion,
  RepositorioMensajes,
} from '../dominio/puertos.js';
import { exigirParticipante } from './exigirParticipante.js';

/**
 * CU19, RN-X5 y RN-X9: guarda el mensaje de un participante activo y devuelve su vista. El id lo
 * elige el navegador: si ese mensaje ya se guardó (un reintento de algo que llegó), devuelve el
 * guardado en lugar de duplicarlo.
 */
export class EnviarMensaje {
  constructor(
    private readonly participacion: ConsultaParticipacion,
    private readonly mensajes: RepositorioMensajes,
    private readonly consultas: ConsultaMensajes,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    viajeId: string,
    autorId: string,
    id: string,
    contenido: string,
  ): Promise<MensajeVista> {
    await exigirParticipante(this.participacion, viajeId, autorId);
    const mensaje = Mensaje.escribir({
      id,
      viajeId,
      autorId,
      contenido,
      ahora: this.reloj.ahora(),
    });
    const enviado = await this.yaEnviado(viajeId, autorId, id);
    if (enviado) return enviado;
    try {
      await this.mensajes.guardar(mensaje);
    } catch (error) {
      // Dos envíos del mismo mensaje a la vez: el segundo devuelve el que guardó el primero.
      const repetido = error instanceof ErrorDeDominio && error.codigo === 'MENSAJE_EXISTENTE';
      const guardado = repetido ? await this.yaEnviado(viajeId, autorId, id) : null;
      if (!guardado) throw error;
      return guardado;
    }
    const vista = await this.consultas.obtener(viajeId, id);
    if (!vista) throw new Error('El mensaje recién guardado no se encontró');
    return vista;
  }

  /** El mensaje con ese id en el viaje, si lo escribió el mismo autor; si es de otro, rechaza. */
  private async yaEnviado(viajeId: string, autorId: string, id: string) {
    const vista = await this.consultas.obtener(viajeId, id);
    if (vista && vista.autor.id !== autorId) throw mensajeExistente();
    return vista;
  }
}
