import { ErrorDeDominio } from '../../../comun/errores.js';
import type { LectorDeViajes } from '../../viajes/dominio/puertos.js';
import type { Viaje } from '../../viajes/dominio/viaje.js';

export async function cargarViaje(viajes: LectorDeViajes, viajeId: string): Promise<Viaje> {
  const viaje = await viajes.obtener(viajeId);
  if (!viaje) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');
  return viaje;
}
