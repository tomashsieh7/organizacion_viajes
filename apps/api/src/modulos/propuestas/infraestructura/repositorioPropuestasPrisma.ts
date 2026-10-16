import { aMonto } from '../../../comun/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { Propuesta } from '../dominio/propuesta.js';
import type { RepositorioPropuestas } from '../dominio/puertos.js';

export class RepositorioPropuestasPrisma implements RepositorioPropuestas {
  constructor(private readonly db: ClientePrisma) {}

  async obtenerParaModificar(viajeId: string, propuestaId: string): Promise<Propuesta | null> {
    const bloqueada = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM propuesta WHERE id = ${propuestaId}::uuid AND viaje_id = ${viajeId}::uuid FOR UPDATE`;
    if (bloqueada.length === 0) return null;
    const p = await this.db.propuesta.findUniqueOrThrow({
      where: { id: propuestaId },
      include: { votos: true },
    });
    return Propuesta.reconstruir({
      id: p.id,
      viajeId: p.viajeId,
      autorId: p.autorId,
      tipo: p.tipo,
      descripcion: p.descripcion,
      precio: p.precio === null ? null : aMonto(p.precio),
      ubicacion: p.ubicacion,
      latitud: p.latitud,
      longitud: p.longitud,
      estado: p.estado,
      resueltaPorId: p.resueltaPorId,
      resueltaEn: p.resueltaEn,
      creadaEn: p.creadaEn,
      votos: p.votos.map((v) => ({
        usuarioId: v.usuarioId,
        valor: v.valor,
        emitidoEn: v.emitidoEn,
      })),
    });
  }

  async guardar(propuesta: Propuesta): Promise<void> {
    const { votos, ...p } = propuesta.aDatos();
    const cambios = {
      descripcion: p.descripcion,
      precio: p.precio === null ? null : BigInt(p.precio),
      ubicacion: p.ubicacion,
      latitud: p.latitud,
      longitud: p.longitud,
      estado: p.estado,
      resueltaPorId: p.resueltaPorId,
      resueltaEn: p.resueltaEn,
    };
    await this.db.propuesta.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        viajeId: p.viajeId,
        autorId: p.autorId,
        tipo: p.tipo,
        creadaEn: p.creadaEn,
        ...cambios,
      },
      update: cambios,
    });
    await this.db.voto.deleteMany({
      where: { propuestaId: p.id, usuarioId: { notIn: votos.map((v) => v.usuarioId) } },
    });
    for (const v of votos) {
      await this.db.voto.upsert({
        where: { propuestaId_usuarioId: { propuestaId: p.id, usuarioId: v.usuarioId } },
        create: {
          propuestaId: p.id,
          usuarioId: v.usuarioId,
          valor: v.valor,
          emitidoEn: v.emitidoEn,
        },
        update: { valor: v.valor, emitidoEn: v.emitidoEn },
      });
    }
  }
}
