import type { Cronograma } from '@viajes/compartido';
import type { LectorDeViajes } from '../../viajes/dominio/puertos.js';
import type { ConsultaItinerario } from '../dominio/puertos.js';
import { cargarViaje } from './cargarViaje.js';

/** CU16: todos los días del viaje con sus actividades y el alojamiento de cada noche (P21). */
export class ConsultarCronograma {
  constructor(
    private readonly viajes: LectorDeViajes,
    private readonly consultas: ConsultaItinerario,
  ) {}

  async ejecutar(viajeId: string): Promise<Cronograma> {
    const viaje = await cargarViaje(this.viajes, viajeId);
    const [actividades, alojamientos] = await Promise.all([
      this.consultas.actividadesConfirmadas(viajeId),
      this.consultas.alojamientosConfirmados(viajeId),
    ]);
    // RN-C1: también los días sin actividades.
    const dias = viaje.rango.dias().map((fecha) => ({
      fecha,
      actividades: actividades.filter((a) => a.fecha === fecha),
      // RN-C3: el día de salida no cuenta como noche del alojamiento.
      alojamientos: alojamientos
        .filter((a) => a.estadia.incluyeNoche(fecha))
        .map(({ id, nombre, ubicacion }) => ({ id, nombre, ubicacion })),
    }));
    return { dias };
  }
}
