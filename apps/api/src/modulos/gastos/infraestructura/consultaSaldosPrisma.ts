import type {
  DeudaVista,
  PagoDeActividad,
  PagoRegistrado,
  PersonaVista,
  RolEnDeuda,
} from '@viajes/compartido';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { ConsultaSaldos } from '../dominio/puertos.js';
import { persona, PERSONA } from './filasPrisma.js';

const aPago = (p: {
  id: string;
  monto: bigint;
  fecha: Date;
  registradoPor: PersonaVista;
}): PagoRegistrado => ({
  id: p.id,
  monto: Number(p.monto),
  fecha: p.fecha.toISOString(),
  registradoPor: persona(p.registradoPor),
});

const INCLUIR_PAGO = { registradoPor: PERSONA } as const;

export class ConsultaSaldosPrisma implements ConsultaSaldos {
  constructor(private readonly db: ClientePrisma) {}

  async deudas(viajeId: string, usuarioId: string, rol: RolEnDeuda): Promise<DeudaVista[]> {
    const filas = await this.db.deuda.findMany({
      where: {
        viajeId,
        monto: { gt: 0 },
        ...(rol === 'deudor' ? { deudorId: usuarioId } : { acreedorId: usuarioId }),
      },
      include: {
        deudor: PERSONA,
        acreedor: PERSONA,
        pagos: { include: INCLUIR_PAGO, orderBy: [{ fecha: 'desc' }, { id: 'desc' }] },
      },
      orderBy: [{ monto: 'desc' }, { id: 'asc' }],
    });
    return filas.map((f) => ({
      id: f.id,
      contraparte: persona(rol === 'deudor' ? f.acreedor : f.deudor),
      monto: Number(f.monto),
      ultimaActualizacion: f.ultimaActualizacion.toISOString(),
      pagos: f.pagos.map(aPago),
    }));
  }

  async pagosDe(viajeId: string, usuarioId: string): Promise<PagoDeActividad[]> {
    const filas = await this.db.pago.findMany({
      where: { deuda: { viajeId, OR: [{ deudorId: usuarioId }, { acreedorId: usuarioId }] } },
      include: { deuda: { include: { deudor: PERSONA, acreedor: PERSONA } } },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    });
    return filas.map((p) => ({
      id: p.id,
      monto: Number(p.monto),
      fecha: p.fecha.toISOString(),
      deudor: persona(p.deuda.deudor),
      acreedor: persona(p.deuda.acreedor),
    }));
  }

  async obtenerPago(viajeId: string, pagoId: string): Promise<PagoRegistrado | null> {
    const p = await this.db.pago.findFirst({
      where: { id: pagoId, deuda: { viajeId } },
      include: INCLUIR_PAGO,
    });
    return p ? aPago(p) : null;
  }
}
