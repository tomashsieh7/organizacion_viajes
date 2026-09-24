import type {
  CategoriaGasto,
  DatosGastoNuevo,
  DeudaVista,
  GastoVista,
  PagoRegistrado,
  RolEnDeuda,
} from '@viajes/compartido';
import type { Deuda } from './deuda.js';
import type { EstrategiaDivision } from './division.js';
import type { Gasto } from './gasto.js';

export interface RepositorioGastos {
  crear(gasto: Gasto): Promise<void>;
}

/** Par de viajeros cuya deuda se va a modificar. */
export interface ParDeViajeros {
  deudorId: string;
  acreedorId: string;
}

export interface RepositorioDeudas {
  /**
   * Devuelve las deudas de los pares pedidos y de sus opuestos, bloqueadas hasta el fin de la
   * transacción (D18). Las que no existen se crean en cero. Los bloqueos se toman siempre en el
   * mismo orden, para que dos gastos simultáneos no se bloqueen mutuamente.
   */
  obtenerParaModificar(viajeId: string, pares: ParDeViajeros[], moneda: string): Promise<Deuda[]>;
  /** La deuda de ese par, bloqueada hasta el fin de la transacción; null si no existe. */
  obtenerParaPagar(viajeId: string, par: ParDeViajeros, moneda: string): Promise<Deuda | null>;
  /** Guarda el saldo de cada deuda y los pagos que se le registraron. */
  guardar(deudas: Deuda[]): Promise<void>;
}

export interface ReposGastos {
  gastos: RepositorioGastos;
  deudas: RepositorioDeudas;
}

export interface ConsultaCategorias {
  listar(): Promise<CategoriaGasto[]>;
  existe(categoriaId: string): Promise<boolean>;
}

export interface ConsultaGastos {
  /** Gastos del viaje, del más reciente al más viejo. */
  listar(viajeId: string): Promise<GastoVista[]>;
  obtener(viajeId: string, gastoId: string): Promise<GastoVista | null>;
}

export interface ConsultaSaldos {
  /** CU21 y CU22: deudas con saldo pendiente donde el usuario es deudor o acreedor. */
  deudas(viajeId: string, usuarioId: string, rol: RolEnDeuda): Promise<DeudaVista[]>;
  obtenerPago(viajeId: string, pagoId: string): Promise<PagoRegistrado | null>;
}

/** Elige la estrategia según el modo pedido; se arma en el punto de composición. */
export type FabricaDeDivision = (datos: DatosGastoNuevo) => EstrategiaDivision;
