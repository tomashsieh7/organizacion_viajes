import { ErrorDeDominio } from '../../../comun/errores.js';
import type { BuscadorDeUsuarios } from '../dominio/puertos.js';
import type { DependenciasViajes } from './dependencias.js';
import { modificarViaje } from './modificarViaje.js';

/** CU02. */
export class AgregarViajero {
  constructor(
    private readonly deps: DependenciasViajes,
    private readonly buscador: BuscadorDeUsuarios,
  ) {}

  async ejecutar(viajeId: string, solicitanteId: string, email: string): Promise<string> {
    const usuarioId = await this.buscador.buscarPorIdentificador('EMAIL_CONTRASENA', email);
    if (!usuarioId) {
      throw new ErrorDeDominio(
        'NO_ENCONTRADO',
        'USUARIO_NO_REGISTRADO',
        'No hay ningún usuario registrado con ese email',
      );
    }
    await modificarViaje(this.deps, viajeId, async (viaje) => {
      viaje.agregarViajero(solicitanteId, usuarioId, this.deps.reloj.ahora());
    });
    return usuarioId;
  }
}
