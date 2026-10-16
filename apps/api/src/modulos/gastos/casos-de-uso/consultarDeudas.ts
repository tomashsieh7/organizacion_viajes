import type { DeudaVista, PagoDeActividad, RolEnDeuda } from '@viajes/compartido';
import type { ConsultaSaldos } from '../dominio/puertos.js';

/** CU21 y CU22: lo que el usuario debe y lo que le deben en el viaje. */
export class ConsultarDeudas {
  constructor(private readonly saldos: ConsultaSaldos) {}

  ejecutar(viajeId: string, usuarioId: string, rol: RolEnDeuda): Promise<DeudaVista[]> {
    return this.saldos.deudas(viajeId, usuarioId, rol);
  }

  /** Para la Actividad de Cuentas: cada uno ve solo los pagos que hizo o recibió. */
  pagos(viajeId: string, usuarioId: string): Promise<PagoDeActividad[]> {
    return this.saldos.pagosDe(viajeId, usuarioId);
  }
}
