import type { CategoriaGasto, GastoVista } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaCategorias, ConsultaGastos } from '../dominio/puertos.js';

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
