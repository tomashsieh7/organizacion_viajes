import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { aFecha, deFecha } from '../../../comun/infraestructura/conversiones.js';
import type { LectorDeViajes, RepositorioViajes } from '../dominio/puertos.js';
import { Viaje } from '../dominio/viaje.js';

export class RepositorioViajesPrisma implements RepositorioViajes, LectorDeViajes {
  constructor(private readonly db: ClientePrisma) {}

  async obtenerParaModificar(viajeId: string): Promise<Viaje | null> {
    const bloqueado = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM viaje WHERE id = ${viajeId}::uuid FOR UPDATE`;
    if (bloqueado.length === 0) return null;
    return this.obtener(viajeId);
  }

  async obtener(viajeId: string): Promise<Viaje | null> {
    const v = await this.db.viaje.findUnique({
      where: { id: viajeId },
      include: { membresias: true },
    });
    if (!v) return null;
    return Viaje.reconstruir({
      id: v.id,
      nombre: v.nombre,
      destino: v.destino,
      fechaInicio: aFecha(v.fechaInicio),
      fechaFin: aFecha(v.fechaFin),
      monedaCodigo: v.monedaCodigo,
      creadoPorId: v.creadoPorId,
      creadoEn: v.creadoEn,
      membresias: v.membresias.map((m) => ({
        usuarioId: m.usuarioId,
        rol: m.rol,
        estado: m.estado,
        bajaConDeuda: m.bajaConDeuda,
        altaEn: m.altaEn,
        bajaEn: m.bajaEn,
      })),
    });
  }

  async guardar(viaje: Viaje): Promise<void> {
    const { membresias, ...v } = viaje.aDatos();
    const datosViaje = {
      nombre: v.nombre,
      destino: v.destino,
      fechaInicio: deFecha(v.fechaInicio),
      fechaFin: deFecha(v.fechaFin),
      monedaCodigo: v.monedaCodigo,
    };
    await this.db.viaje.upsert({
      where: { id: v.id },
      create: { id: v.id, ...datosViaje, creadoPorId: v.creadoPorId, creadoEn: v.creadoEn },
      update: datosViaje,
    });
    // Primero las membresías que dejan de ser Admin y después la del nuevo Admin, para no
    // violar en ningún momento el índice único de Admin activo por viaje.
    const ordenadas = [...membresias].sort(
      (a, b) => Number(a.rol === 'ADMIN') - Number(b.rol === 'ADMIN'),
    );
    for (const m of ordenadas) {
      const datos = {
        rol: m.rol,
        estado: m.estado,
        bajaConDeuda: m.bajaConDeuda,
        bajaEn: m.bajaEn,
      };
      await this.db.membresia.upsert({
        where: { viajeId_usuarioId: { viajeId: v.id, usuarioId: m.usuarioId } },
        create: { viajeId: v.id, usuarioId: m.usuarioId, altaEn: m.altaEn, ...datos },
        update: datos,
      });
    }
  }
}
