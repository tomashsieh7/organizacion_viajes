import { randomUUID } from 'node:crypto';
import type { DatosAlojamientoNuevo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import { Coordenadas } from '../../../comun/valores/coordenadas.js';
import { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import { Propuesta } from '../../propuestas/dominio/propuesta.js';
import { proponerUnaVez } from '../../propuestas/casos-de-uso/proponerUnaVez.js';
import type {
  ConsultaFechasDeViaje,
  ConsultaOrigenesDePropuestas,
} from '../../propuestas/dominio/puertos.js';
import type { ReposAlojamientos } from '../dominio/puertos.js';

/** CU05: proponer alojamiento. Si el mismo formulario reintenta, devuelve la propuesta ya creada. */
export class ProponerAlojamiento {
  constructor(
    private readonly unidad: UnidadDeTrabajo<ReposAlojamientos>,
    private readonly fechas: ConsultaFechasDeViaje,
    private readonly reloj: Reloj,
    private readonly origenes: ConsultaOrigenesDePropuestas,
  ) {}

  async ejecutar(viajeId: string, autorId: string, datos: DatosAlojamientoNuevo): Promise<string> {
    const estadia = RangoFechas.crear(datos.fechaDesde, datos.fechaHasta);
    const viaje = await this.fechas.rango(viajeId);
    if (!viaje) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');
    // RN-X4 (P11): entrada y salida dentro del viaje.
    if (!viaje.contiene(estadia)) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'FUERA_DEL_VIAJE',
        `Las fechas tienen que estar entre el ${viaje.desde} y el ${viaje.hasta}`,
        { desde: viaje.desde, hasta: viaje.hasta },
      );
    }
    const propuesta = Propuesta.proponer({
      id: datos.id ?? randomUUID(),
      viajeId,
      autorId,
      tipo: 'ALOJAMIENTO',
      descripcion: datos.descripcion,
      precio: datos.precio,
      ubicacion: datos.ubicacion,
      coordenadas: Coordenadas.opcionales(datos.latitud, datos.longitud),
      ahora: this.reloj.ahora(),
    });
    await proponerUnaVez(
      this.origenes,
      { id: propuesta.id, viajeId, autorId, tipo: 'ALOJAMIENTO' },
      () =>
        this.unidad.ejecutar((repos) =>
          repos.alojamientos.crear(propuesta, { nombre: datos.nombre, estadia }),
        ),
    );
    return propuesta.id;
  }
}
