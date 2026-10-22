import { randomUUID } from 'node:crypto';
import type { DatosGastoNuevo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import { Dinero } from '../../../comun/valores/dinero.js';
import { Gasto, gastoExistente } from '../dominio/gasto.js';
import type {
  ConsultaCategorias,
  ConsultaGastos,
  FabricaDeDivision,
  ReposGastos,
} from '../dominio/puertos.js';

export interface DependenciasAnotarGasto {
  unidad: UnidadDeTrabajo<ReposGastos>;
  categorias: ConsultaCategorias;
  gastos: ConsultaGastos;
  division: FabricaDeDivision;
  reloj: Reloj;
}

/**
 * CU20: anota el gasto y actualiza las deudas netas en una sola transacción (RN-G1 a RN-G6). Con el
 * id del intento, reintentar un gasto que ya se anotó lo devuelve sin volver a sumar las deudas
 * (RN-G7).
 */
export class AnotarGasto {
  constructor(private readonly deps: DependenciasAnotarGasto) {}

  async ejecutar(
    viajeId: string,
    registradoPorId: string,
    datos: DatosGastoNuevo,
  ): Promise<string> {
    // Antes de la transacción: el catálogo de categorías no cambia, y consultarlo adentro pediría
    // otra conexión mientras esta retiene bloqueos, lo que traba el pool con muchos gastos a la vez.
    if (!(await this.deps.categorias.existe(datos.categoriaId))) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'CATEGORIA_INEXISTENTE',
        'La categoría no existe',
      );
    }
    const id = datos.id ?? randomUUID();
    if (await this.yaAnotado(viajeId, registradoPorId, id)) return id;
    try {
      return await this.anotar(viajeId, registradoPorId, id, datos);
    } catch (error) {
      // Dos intentos a la vez: el segundo choca con el id, su transacción se deshace entera (también
      // las deudas) y devuelve el gasto que guardó el primero.
      const repetido = error instanceof ErrorDeDominio && error.codigo === 'GASTO_EXISTENTE';
      if (repetido && (await this.yaAnotado(viajeId, registradoPorId, id))) return id;
      throw error;
    }
  }

  /** Si el gasto con ese id ya está anotado por esa persona en el viaje; si es de otro, rechaza. */
  private async yaAnotado(viajeId: string, registradoPorId: string, id: string) {
    const gasto = await this.deps.gastos.obtener(viajeId, id);
    if (gasto && gasto.registradoPor.id !== registradoPorId) throw gastoExistente();
    return gasto !== null;
  }

  private anotar(
    viajeId: string,
    registradoPorId: string,
    id: string,
    datos: DatosGastoNuevo,
  ): Promise<string> {
    return this.deps.unidad.ejecutar(async (repos) => {
      // Dentro de la transacción, para que nadie se dé de baja mientras se le anota una deuda.
      const viaje = await repos.viajes.obtener(viajeId);
      if (!viaje) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');
      // RN-G2 (P12): por defecto paga quien anota.
      const pagadoPorId = datos.pagadoPorId ?? registradoPorId;
      if (!viaje.esParticipanteActivo(pagadoPorId)) {
        throw new ErrorDeDominio(
          'REGLA_DE_NEGOCIO',
          'PAGADOR_NO_PARTICIPANTE',
          'Quien pagó tiene que participar del viaje',
        );
      }
      // RN-G3 (P13): el pagador puede quedar fuera, pero todos los elegidos tienen que participar.
      const ajenos = datos.deudores.filter((d) => !viaje.esParticipanteActivo(d));
      if (ajenos.length > 0) {
        throw new ErrorDeDominio(
          'REGLA_DE_NEGOCIO',
          'DEUDOR_NO_PARTICIPANTE',
          'Todas las personas elegidas tienen que participar del viaje',
          { usuarios: ajenos },
        );
      }
      const ahora = this.deps.reloj.ahora();
      const gasto = Gasto.anotar({
        id,
        viajeId,
        titulo: datos.titulo.trim(),
        categoriaId: datos.categoriaId,
        monto: Dinero.de(datos.monto, viaje.monedaCodigo),
        pagadoPorId,
        registradoPorId,
        deudores: datos.deudores,
        division: this.deps.division(datos),
        ahora,
      });
      const generadas = gasto.deudasGeneradas();
      const deudas = await repos.deudas.obtenerParaModificar(
        viajeId,
        generadas,
        viaje.monedaCodigo,
      );
      const deuda = (deudorId: string, acreedorId: string) => {
        const d = deudas.find((x) => x.deudorId === deudorId && x.acreedorId === acreedorId);
        if (!d) throw new Error(`Falta la deuda de ${deudorId} con ${acreedorId}`);
        return d;
      };
      // RN-G6 y P15: se suma la parte y se compensa con lo que el pagador le debía al deudor.
      for (const g of generadas) {
        const delDeudor = deuda(g.deudorId, g.acreedorId);
        delDeudor.sumar(g.monto, ahora);
        delDeudor.compensarCon(deuda(g.acreedorId, g.deudorId), ahora);
      }
      await repos.gastos.crear(gasto);
      await repos.deudas.guardar(deudas);
      return gasto.id;
    });
  }
}
