import { randomUUID } from 'node:crypto';
import type { DatosAlojamientoNuevo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import { Coordenadas } from '../../../comun/valores/coordenadas.js';
import { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import { Propuesta } from '../../propuestas/dominio/propuesta.js';
import type { ConsultaFechasDeViaje } from '../../propuestas/dominio/puertos.js';
import type { ReposAlojamientos } from '../dominio/puertos.js';

const propuestaExistente = () =>
  new ErrorDeDominio('CONFLICTO', 'PROPUESTA_EXISTENTE', 'Ya existe una propuesta con ese id');

/** CU05: proponer alojamiento. Si el mismo formulario reintenta, devuelve la propuesta ya creada. */
export class ProponerAlojamiento {
  constructor(
    private readonly unidad: UnidadDeTrabajo<ReposAlojamientos>,
    private readonly fechas: ConsultaFechasDeViaje,
    private readonly reloj: Reloj,
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
    const guardar = () =>
      this.unidad.ejecutar(async (repos) => {
        // Un reintento del mismo formulario trae el mismo id: la propuesta ya existe y no se
        // duplica. Con el id de una propuesta ajena no se toca nada.
        const origen = await repos.alojamientos.origen(propuesta.id);
        if (!origen) {
          await repos.alojamientos.crear(propuesta, { nombre: datos.nombre, estadia });
        } else if (
          origen.viajeId !== viajeId ||
          origen.autorId !== autorId ||
          origen.tipo !== 'ALOJAMIENTO'
        ) {
          throw propuestaExistente();
        }
      });
    try {
      await guardar();
    } catch (error) {
      // Dos envíos simultáneos del mismo intento: el segundo choca con el primero al insertar y
      // vuelve a mirar, ya con la propuesta guardada.
      if (!(error instanceof ErrorDeDominio && error.codigo === 'PROPUESTA_EXISTENTE')) throw error;
      await guardar();
    }
    return propuesta.id;
  }
}
