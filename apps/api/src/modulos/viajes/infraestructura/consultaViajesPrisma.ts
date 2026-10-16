import type { DetalleViaje, Moneda, Participante, ResumenViaje } from '@viajes/compartido';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { aFecha } from '../../../comun/infraestructura/conversiones.js';
import type { Acceso, ConsultaViajes } from '../dominio/puertos.js';
import { tipoDeAcceso } from '../dominio/membresia.js';
import { saldosPendientesDe } from './filasPrisma.js';

export class ConsultaViajesPrisma implements ConsultaViajes {
  constructor(private readonly db: ClientePrisma) {}

  async obtenerAcceso(viajeId: string, usuarioId: string): Promise<Acceso | null> {
    const m = await this.db.membresia.findUnique({
      where: { viajeId_usuarioId: { viajeId, usuarioId } },
    });
    return m && m.estado === 'ACTIVA' ? { rol: m.rol } : null;
  }

  /** Viajes de los que el usuario tiene saldos pendientes, entre los indicados (RN-E6). */
  private async conSaldosPendientes(usuarioId: string, viajeIds: string[]): Promise<Set<string>> {
    if (viajeIds.length === 0) return new Set();
    const filas = await this.db.deuda.findMany({
      where: { viajeId: { in: viajeIds }, ...saldosPendientesDe(usuarioId) },
      select: { viajeId: true },
      distinct: ['viajeId'],
    });
    return new Set(filas.map((f) => f.viajeId));
  }

  async listarDeUsuario(usuarioId: string): Promise<ResumenViaje[]> {
    const membresias = await this.db.membresia.findMany({
      where: { usuarioId },
      include: { viaje: true },
      orderBy: { viaje: { fechaInicio: 'asc' } },
    });
    const saldos = await this.conSaldosPendientes(
      usuarioId,
      membresias.filter((m) => m.estado !== 'ACTIVA').map((m) => m.viajeId),
    );
    return membresias.flatMap(({ viaje: v, rol, estado }) => {
      const miAcceso = tipoDeAcceso(estado, saldos.has(v.id));
      return miAcceso
        ? [
            {
              id: v.id,
              nombre: v.nombre,
              destino: v.destino,
              fechaInicio: aFecha(v.fechaInicio),
              fechaFin: aFecha(v.fechaFin),
              monedaCodigo: v.monedaCodigo,
              miRol: rol,
              miAcceso,
            },
          ]
        : [];
    });
  }

  async obtenerDetalle(
    viajeId: string,
    usuarioId: string,
  ): Promise<Omit<DetalleViaje, 'miDeudaPendiente'> | null> {
    const v = await this.db.viaje.findUnique({
      where: { id: viajeId },
      include: { moneda: true, membresias: true },
    });
    const mia = v?.membresias.find((m) => m.usuarioId === usuarioId);
    if (!v || !mia) return null;
    const saldos =
      mia.estado !== 'ACTIVA' && (await this.conSaldosPendientes(usuarioId, [viajeId])).size > 0;
    const miAcceso = tipoDeAcceso(mia.estado, saldos);
    if (!miAcceso) return null;
    return {
      id: v.id,
      nombre: v.nombre,
      destino: v.destino,
      fechaInicio: aFecha(v.fechaInicio),
      fechaFin: aFecha(v.fechaFin),
      moneda: v.moneda,
      miRol: mia.rol,
      miAcceso,
      cantidadParticipantes: v.membresias.filter((m) => m.estado === 'ACTIVA').length,
    };
  }

  async listarParticipantes(viajeId: string): Promise<Participante[]> {
    const membresias = await this.db.membresia.findMany({
      where: { viajeId, estado: 'ACTIVA' },
      include: { usuario: true },
    });
    return membresias
      .map((m) => ({
        usuarioId: m.usuarioId,
        nombre: m.usuario.nombre,
        apodo: m.usuario.apodo,
        rol: m.rol,
      }))
      .sort(
        (a, b) =>
          Number(b.rol === 'ADMIN') - Number(a.rol === 'ADMIN') || a.nombre.localeCompare(b.nombre),
      );
  }

  async obtenerParticipante(viajeId: string, usuarioId: string): Promise<Participante | null> {
    const m = await this.db.membresia.findUnique({
      where: { viajeId_usuarioId: { viajeId, usuarioId } },
      include: { usuario: true },
    });
    return m && m.estado === 'ACTIVA'
      ? { usuarioId, nombre: m.usuario.nombre, apodo: m.usuario.apodo, rol: m.rol }
      : null;
  }

  async listarMonedas(): Promise<Moneda[]> {
    return this.db.moneda.findMany({ orderBy: { codigo: 'asc' } });
  }

  async existeMoneda(codigo: string): Promise<boolean> {
    return (await this.db.moneda.count({ where: { codigo } })) > 0;
  }
}
