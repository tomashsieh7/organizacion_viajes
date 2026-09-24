import type { InjectionKey } from 'vue';
import type {
  CategoriaGasto,
  DatosGastoNuevo,
  DeudaVista,
  GastoVista,
  RolEnDeuda,
} from '@viajes/compartido';
import { pedir } from './http';

export interface ClienteGastos {
  categorias(): Promise<CategoriaGasto[]>;
  listar(viajeId: string): Promise<GastoVista[]>;
  anotar(viajeId: string, datos: DatosGastoNuevo): Promise<GastoVista>;
  deudas(viajeId: string, rol: RolEnDeuda): Promise<DeudaVista[]>;
}

export const CLIENTE_GASTOS: InjectionKey<ClienteGastos> = Symbol('ClienteGastos');

export class ClienteGastosHttp implements ClienteGastos {
  async categorias() {
    return (await pedir<{ categorias: CategoriaGasto[] }>('GET', '/api/categorias-gasto'))
      .categorias;
  }
  async listar(viajeId: string) {
    return (await pedir<{ gastos: GastoVista[] }>('GET', `/api/viajes/${viajeId}/gastos`)).gastos;
  }
  async anotar(viajeId: string, datos: DatosGastoNuevo) {
    return (await pedir<{ gasto: GastoVista }>('POST', `/api/viajes/${viajeId}/gastos`, datos))
      .gasto;
  }
  async deudas(viajeId: string, rol: RolEnDeuda) {
    return (
      await pedir<{ deudas: DeudaVista[] }>('GET', `/api/viajes/${viajeId}/deudas?rol=${rol}`)
    ).deudas;
  }
}
