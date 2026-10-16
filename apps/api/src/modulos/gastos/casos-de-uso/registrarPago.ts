import { randomUUID } from 'node:crypto';
import type { DatosPagoNuevo, RespuestaPago } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import { Dinero } from '../../../comun/valores/dinero.js';
import type { ConsultaSaldos, ReposGastos } from '../dominio/puertos.js';

export interface DependenciasRegistrarPago {
  unidad: UnidadDeTrabajo<Pick<ReposGastos, 'deudas' | 'viajes'>>;
  saldos: ConsultaSaldos;
  reloj: Reloj;
}

/**
 * CU23 (RN-P1 a RN-P6): el deudor paga todo o parte de lo que le debe a un acreedor. La deuda se
 * bloquea, así dos pagos simultáneos no superan juntos el saldo (D18).
 */
export class RegistrarPago {
  constructor(private readonly deps: DependenciasRegistrarPago) {}

  async ejecutar(viajeId: string, deudorId: string, datos: DatosPagoNuevo): Promise<RespuestaPago> {
    const { pagoId, saldo } = await this.deps.unidad.ejecutar(async (repos) => {
      const viaje = await repos.viajes.obtener(viajeId);
      if (!viaje) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');
      const deuda = await repos.deudas.obtenerParaPagar(
        viajeId,
        { deudorId, acreedorId: datos.acreedorId },
        viaje.monedaCodigo,
      );
      if (!deuda || !deuda.monto.esPositivo()) {
        throw new ErrorDeDominio(
          'NO_ENCONTRADO',
          'SIN_DEUDA_CON_ACREEDOR',
          'No tenés una deuda pendiente con esa persona',
        );
      }
      const pago = deuda.registrarPago({
        id: randomUUID(),
        monto: Dinero.de(datos.monto, viaje.monedaCodigo),
        registradoPorId: deudorId,
        ahora: this.deps.reloj.ahora(),
      });
      await repos.deudas.guardar([deuda]);
      return { pagoId: pago.id, saldo: deuda.monto.monto };
    });
    const pago = await this.deps.saldos.obtenerPago(viajeId, pagoId);
    if (!pago) throw new Error('El pago recién registrado no se encontró');
    return { pago, saldo };
  }
}
