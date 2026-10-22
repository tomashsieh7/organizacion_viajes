import type { MapaDelDia } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import { sumarDias, type Fecha } from '../../../comun/valores/fecha.js';
import type { LectorDeViajes } from '../../viajes/dominio/puertos.js';
import type { ConsultaItinerario } from '../dominio/puertos.js';
import { recorridoEnLineaRecta } from '../dominio/recorrido.js';
import { siguenDelDiaAnterior } from '../dominio/siguenDelDiaAnterior.js';
import { cargarViaje } from './cargarViaje.js';

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
    // RN-M9: quedan fuera del recorrido, que es solo de las actividades del día.
    const siguen = siguenDelDiaAnterior(confirmadas, sumarDias(dia, -1));
    return {
      dia,
      diasConActividad,
      siguenDelDiaAnterior: siguen,
      actividades,
      recorrido: recorridoEnLineaRecta(actividades),
      // RN-M3: sin aviso si el día tiene algo que sigue del anterior, igual que el cronograma.
      aviso: actividades.length === 0 && siguen.length === 0 ? 'SIN_ACTIVIDADES_CONFIRMADAS' : null,
    };
  }
}
