import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { Dinero } from '../../../comun/valores/dinero.js';
import { Deuda } from '../dominio/deuda.js';
import type { ParDeViajeros, RepositorioDeudas } from '../dominio/puertos.js';

interface FilaDeuda {
  id: string;
  deudor_id: string;
  acreedor_id: string;
  monto: bigint;
  ultima_actualizacion: Date;
}

export class RepositorioDeudasPrisma implements RepositorioDeudas {
  constructor(private readonly db: ClientePrisma) {}

  async obtenerParaModificar(
    viajeId: string,
    pares: ParDeViajeros[],
    moneda: string,
  ): Promise<Deuda[]> {
    if (pares.length === 0) return [];
    // Solo los ids del par: quien llama puede pasar objetos con más datos (por ejemplo, el monto).
    // Ordenados: dos transacciones crean las filas que faltan en el mismo orden, así no se
    // esperan en cruz (sin orden, un gasto de A a B y otro de B a A podían trabarse).
    const todos = pares
      .flatMap(({ deudorId, acreedorId }) => [
        { deudorId, acreedorId },
        { deudorId: acreedorId, acreedorId: deudorId },
      ])
      .sort(
        (a, b) => a.deudorId.localeCompare(b.deudorId) || a.acreedorId.localeCompare(b.acreedorId),
      );
    // Las filas que faltan se crean en cero; si otra transacción crea la misma, se espera a que termine.
    await this.db.deuda.createMany({
      data: todos.map((p) => ({ viajeId, ...p })),
      skipDuplicates: true,
    });
    const ids = (
      await this.db.deuda.findMany({
        where: { viajeId, OR: todos },
        select: { id: true },
      })
    ).map((f) => f.id);
    // Se bloquean por id en orden: dos gastos sobre los mismos pares nunca se esperan en cruz.
    const filas = await this.db.$queryRaw<FilaDeuda[]>`
      SELECT id, deudor_id, acreedor_id, monto, ultima_actualizacion
      FROM deuda WHERE id = ANY(${ids}::uuid[]) ORDER BY id FOR UPDATE`;
    return filas.map((f) => this.reconstruir(viajeId, f, moneda));
  }

  async obtenerParaPagar(
    viajeId: string,
    { deudorId, acreedorId }: ParDeViajeros,
    moneda: string,
  ): Promise<Deuda | null> {
    const [f] = await this.db.$queryRaw<FilaDeuda[]>`
      SELECT id, deudor_id, acreedor_id, monto, ultima_actualizacion FROM deuda
      WHERE viaje_id = ${viajeId}::uuid AND deudor_id = ${deudorId}::uuid
        AND acreedor_id = ${acreedorId}::uuid
      FOR UPDATE`;
    return f ? this.reconstruir(viajeId, f, moneda) : null;
  }

  async guardar(deudas: Deuda[]): Promise<void> {
    for (const d of deudas) {
      const { id, monto, ultimaActualizacion } = d.aDatos();
      await this.db.deuda.update({
        where: { id },
        data: { monto: BigInt(monto.monto), ultimaActualizacion },
      });
      const pagos = d.pagosSinGuardar();
      if (pagos.length > 0) {
        await this.db.pago.createMany({
          data: pagos.map((p) => ({ ...p, monto: BigInt(p.monto.monto) })),
          skipDuplicates: true,
        });
      }
    }
  }

  private reconstruir(viajeId: string, f: FilaDeuda, moneda: string): Deuda {
    return Deuda.reconstruir({
      id: f.id,
      viajeId,
      deudorId: f.deudor_id,
      acreedorId: f.acreedor_id,
      monto: Dinero.de(Number(f.monto), moneda),
      ultimaActualizacion: f.ultima_actualizacion,
    });
  }
}
