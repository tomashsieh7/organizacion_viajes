import { randomUUID } from 'node:crypto';
import type {
  CategoriaGasto,
  DatosGastoNuevo,
  DeudaVista,
  GastoVista,
  RolEnDeuda,
} from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { Reloj } from '../../../compartido/reloj.js';
import type { UnidadDeTrabajo } from '../../../compartido/unidadDeTrabajo.js';
import { Dinero } from '../../../compartido/valores/dinero.js';
import type { LectorDeViajes } from '../../viajes/dominio/puertos.js';
import { Gasto } from '../dominio/gasto.js';
import type {
  ConsultaCategorias,
  ConsultaGastos,
  ConsultaSaldos,
  FabricaDeDivision,
  ReposGastos,
} from '../dominio/puertos.js';

export interface DependenciasAnotarGasto {
  unidad: UnidadDeTrabajo<ReposGastos>;
  viajes: LectorDeViajes;
  categorias: ConsultaCategorias;
  division: FabricaDeDivision;
  reloj: Reloj;
}

/** CU20: anota el gasto y actualiza las deudas netas en una sola transacción (RN-G1 a RN-G6). */
export class AnotarGasto {
  constructor(private readonly deps: DependenciasAnotarGasto) {}

  async ejecutar(
    viajeId: string,
    registradoPorId: string,
    datos: DatosGastoNuevo,
  ): Promise<string> {
    const viaje = await this.deps.viajes.obtener(viajeId);
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
    if (!(await this.deps.categorias.existe(datos.categoriaId))) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'CATEGORIA_INEXISTENTE',
        'La categoría no existe',
      );
    }
    const ahora = this.deps.reloj.ahora();
    const gasto = Gasto.anotar({
      id: randomUUID(),
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

    await this.deps.unidad.ejecutar(async (repos) => {
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
    });
    return gasto.id;
  }
}

/** Listado de gastos y categorías (CU20). */
export class ConsultarGastos {
  constructor(
    private readonly gastos: ConsultaGastos,
    private readonly categorias: ConsultaCategorias,
  ) {}

  listar(viajeId: string): Promise<GastoVista[]> {
    return this.gastos.listar(viajeId);
  }

  async obtener(viajeId: string, gastoId: string): Promise<GastoVista> {
    const g = await this.gastos.obtener(viajeId, gastoId);
    if (!g) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El gasto no existe');
    return g;
  }

  categoriasDeGasto(): Promise<CategoriaGasto[]> {
    return this.categorias.listar();
  }
}

/** CU21 y CU22: lo que el usuario debe y lo que le deben en el viaje. */
export class ConsultarDeudas {
  constructor(private readonly saldos: ConsultaSaldos) {}

  ejecutar(viajeId: string, usuarioId: string, rol: RolEnDeuda): Promise<DeudaVista[]> {
    return this.saldos.deudas(viajeId, usuarioId, rol);
  }
}
