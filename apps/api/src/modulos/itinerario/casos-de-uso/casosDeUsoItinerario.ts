import type { Cronograma, MapaDelDia } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { Fecha } from '../../../compartido/valores/fecha.js';
import type { LectorDeViajes } from '../../viajes/dominio/puertos.js';
import type { Viaje } from '../../viajes/dominio/viaje.js';
import type { ConsultaItinerario } from '../dominio/puertos.js';
import { recorridoEnLineaRecta } from '../dominio/recorrido.js';

async function cargarViaje(viajes: LectorDeViajes, viajeId: string): Promise<Viaje> {
  const viaje = await viajes.obtener(viajeId);
  if (!viaje) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');
  return viaje;
}

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

/** CU17: actividades confirmadas de un día, en orden y con el recorrido que las une. */
export class ConsultarMapa {
  constructor(
    private readonly viajes: LectorDeViajes,
    private readonly consultas: ConsultaItinerario,
  ) {}

  async ejecutar(viajeId: string, hoy: Fecha, diaElegido?: Fecha): Promise<MapaDelDia> {
    const viaje = await cargarViaje(this.viajes, viajeId);
    const rango = viaje.rango;
    if (diaElegido !== undefined && !rango.contiene(diaElegido)) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'FUERA_DEL_VIAJE',
        `El día tiene que estar entre el ${rango.desde} y el ${rango.hasta}`,
        { desde: rango.desde, hasta: rango.hasta },
      );
    }
    const confirmadas = await this.consultas.actividadesConfirmadas(viajeId);
    const diasConActividad = [...new Set(confirmadas.map((a) => a.fecha))];
    // RN-M1 y RN-M7: el día elegido o, si no hay, el que decide el viaje.
    const dia = diaElegido ?? viaje.diaInicialDelMapa(hoy, diasConActividad);
    // RN-M2 y RN-M4: la consulta ya las entrega en orden cronológico.
    const actividades = confirmadas.filter((a) => a.fecha === dia);
    return {
      dia,
      diasConActividad,
      actividades,
      recorrido: recorridoEnLineaRecta(actividades),
      // RN-M3.
      aviso: actividades.length === 0 ? 'SIN_ACTIVIDADES_CONFIRMADAS' : null,
    };
  }
}
