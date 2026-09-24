import type { DetalleViaje, Moneda, Participante, ResumenViaje } from '@viajes/compartido';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import { aFecha, aMonto, deFecha } from '../../../compartido/infraestructura/conversiones.js';
import type {
  Acceso,
  ConsultaDeudas,
  ConsultaSaldosPendientes,
  ConsultaViajes,
  LectorDeViajes,
  RepositorioViajes,
  RetiroDeVotos,
} from '../dominio/puertos.js';
import { tipoDeAcceso, Viaje } from '../dominio/viaje.js';

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

export class ConsultaDeudasPrisma implements ConsultaDeudas {
  constructor(private readonly db: ClientePrisma) {}

  async totalAdeudado(viajeId: string, usuarioId: string): Promise<number> {
    const r = await this.db.deuda.aggregate({
      where: { viajeId, deudorId: usuarioId },
      _sum: { monto: true },
    });
    return aMonto(r._sum.monto ?? 0n);
  }
}

export class RetiroDeVotosPrisma implements RetiroDeVotos {
  constructor(private readonly db: ClientePrisma) {}

  async retirarVotosPendientes(viajeId: string, usuarioId: string): Promise<void> {
    await this.db.voto.deleteMany({
      where: { usuarioId, propuesta: { viajeId, estado: 'PENDIENTE' } },
    });
  }
}

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
      where: {
        viajeId: { in: viajeIds },
        monto: { gt: 0 },
        OR: [{ deudorId: usuarioId }, { acreedorId: usuarioId }],
      },
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

export class ConsultaSaldosPendientesPrisma implements ConsultaSaldosPendientes {
  constructor(private readonly db: ClientePrisma) {}

  async tieneSaldosPendientes(viajeId: string, usuarioId: string): Promise<boolean> {
    const pendiente = await this.db.deuda.findFirst({
      where: {
        viajeId,
        monto: { gt: 0 },
        OR: [{ deudorId: usuarioId }, { acreedorId: usuarioId }],
      },
      select: { id: true },
    });
    return pendiente !== null;
  }
}
