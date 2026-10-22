import { randomUUID } from 'node:crypto';
import type { DatosPagoNuevo, RespuestaPago } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import { Dinero } from '../../../comun/valores/dinero.js';
import { pagoExistente } from '../dominio/deuda.js';
import type { ConsultaSaldos, ReposGastos } from '../dominio/puertos.js';

export interface DependenciasRegistrarPago {
  unidad: UnidadDeTrabajo<Pick<ReposGastos, 'deudas' | 'viajes'>>;
  saldos: ConsultaSaldos;
  reloj: Reloj;
}

/**
 * CU23 (RN-P1 a RN-P7): el deudor paga todo o parte de lo que le debe a un acreedor. La deuda se
 * bloquea, así dos pagos simultáneos no superan juntos el saldo (D18). Con el id del intento,
 * reintentar un pago que ya se registró lo devuelve sin volver a restarlo.
 */
export class RegistrarPago {
  constructor(private readonly deps: DependenciasRegistrarPago) {}

  async ejecutar(viajeId: string, deudorId: string, datos: DatosPagoNuevo): Promise<RespuestaPago> {
    const id = datos.id ?? randomUUID();
    const previo = await this.yaRegistrado(viajeId, deudorId, datos.acreedorId, id);
    if (previo) return previo;
    let saldo: number;
    try {
      saldo = await this.registrar(viajeId, deudorId, id, datos);
    } catch (error) {
      // Dos intentos a la vez: el segundo espera el bloqueo de la deuda y, cuando el primero
      // termina, choca con el id o con el saldo que ya bajó (PAGO_EXCEDE_DEUDA o
      // SIN_DEUDA_CON_ACREEDOR). En cualquier caso, si el pago quedó registrado, se devuelve ese.
      const guardado = await this.yaRegistrado(viajeId, deudorId, datos.acreedorId, id);
      if (!guardado) throw error;
      return guardado;
    }
    const pago = await this.deps.saldos.obtenerPago(viajeId, id);
    if (!pago) throw new Error('El pago recién registrado no se encontró');
    return { pago, saldo };
  }

  /**
   * El pago con ese id en el viaje, con lo que hoy queda de la deuda, si lo registró el mismo
   * deudor; si es de otra persona, rechaza.
   */
  private async yaRegistrado(
    viajeId: string,
    deudorId: string,
    acreedorId: string,
    id: string,
  ): Promise<RespuestaPago | null> {
    const pago = await this.deps.saldos.obtenerPago(viajeId, id);
    if (!pago) return null;
    if (pago.registradoPor.id !== deudorId) throw pagoExistente();
    const deudas = await this.deps.saldos.deudas(viajeId, deudorId, 'deudor');
    const saldo = deudas.find((d) => d.contraparte.id === acreedorId)?.monto ?? 0;
    return { pago, saldo };
  }

  /** Resta el pago de la deuda bloqueada y devuelve lo que queda. */
  private registrar(
    viajeId: string,
    deudorId: string,
    id: string,
    datos: DatosPagoNuevo,
  ): Promise<number> {
    return this.deps.unidad.ejecutar(async (repos) => {
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
      deuda.registrarPago({
        id,
        monto: Dinero.de(datos.monto, viaje.monedaCodigo),
        registradoPorId: deudorId,
        ahora: this.deps.reloj.ahora(),
      });
      await repos.deudas.guardar([deuda]);
      return deuda.monto.monto;
    });
  }
}
