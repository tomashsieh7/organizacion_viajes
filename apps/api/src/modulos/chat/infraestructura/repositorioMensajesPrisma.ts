import {
  esViolacionDeUnicidad,
  type ClientePrisma,
} from '../../../comun/infraestructura/clientePrisma.js';
import { mensajeExistente, type Mensaje } from '../dominio/mensaje.js';
import type { RepositorioMensajes } from '../dominio/puertos.js';

export class RepositorioMensajesPrisma implements RepositorioMensajes {
  constructor(private readonly db: ClientePrisma) {}

  async guardar(mensaje: Mensaje): Promise<void> {
    try {
      await this.db.mensaje.create({ data: mensaje.aDatos() });
    } catch (error) {
      if (esViolacionDeUnicidad(error)) throw mensajeExistente();
      throw error;
    }
  }
}
