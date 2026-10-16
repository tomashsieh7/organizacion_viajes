import { randomUUID } from 'node:crypto';
import type { MensajeVista } from '@viajes/compartido';
import type { Reloj } from '../../../comun/reloj.js';
import { Mensaje } from '../dominio/mensaje.js';
import type {
  ConsultaMensajes,
  ConsultaParticipacion,
  RepositorioMensajes,
} from '../dominio/puertos.js';
import { exigirParticipante } from './exigirParticipante.js';

/** CU19 y RN-X5: guarda el mensaje de un participante activo y devuelve su vista. */
export class EnviarMensaje {
  constructor(
    private readonly participacion: ConsultaParticipacion,
    private readonly mensajes: RepositorioMensajes,
    private readonly consultas: ConsultaMensajes,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(viajeId: string, autorId: string, contenido: string): Promise<MensajeVista> {
    await exigirParticipante(this.participacion, viajeId, autorId);
    const mensaje = Mensaje.escribir({
      id: randomUUID(),
      viajeId,
      autorId,
      contenido,
      ahora: this.reloj.ahora(),
    });
    await this.mensajes.guardar(mensaje);
    const vista = await this.consultas.obtener(viajeId, mensaje.id);
    if (!vista) throw new Error('El mensaje recién guardado no se encontró');
    return vista;
  }
}
