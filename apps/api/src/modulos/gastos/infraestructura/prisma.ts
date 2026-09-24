import type {
  CategoriaGasto,
  DeudaVista,
  GastoVista,
  PersonaVista,
  RolEnDeuda,
} from '@viajes/compartido';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import { Dinero } from '../../../compartido/valores/dinero.js';
import { Deuda } from '../dominio/deuda.js';
import type { Gasto } from '../dominio/gasto.js';
import type {
  ConsultaCategorias,
  ConsultaGastos,
  ConsultaSaldos,
  ParDeViajeros,
  RepositorioDeudas,
  RepositorioGastos,
} from '../dominio/puertos.js';

export class RepositorioGastosPrisma implements RepositorioGastos {
  constructor(private readonly db: ClientePrisma) {}

  async crear(gasto: Gasto): Promise<void> {
    const { partes, monto, ...g } = gasto.aDatos();
    await this.db.gasto.create({
      data: {
        ...g,
        monto: BigInt(monto.monto),
        partes: {
          create: partes.map((p) => ({ usuarioId: p.usuarioId, monto: BigInt(p.monto.monto) })),
        },
      },
    });
  }
}

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
    const todos = pares.flatMap(({ deudorId, acreedorId }) => [
      { deudorId, acreedorId },
      { deudorId: acreedorId, acreedorId: deudorId },
    ]);
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
    return filas.map((f) =>
      Deuda.reconstruir({
        id: f.id,
        viajeId,
        deudorId: f.deudor_id,
        acreedorId: f.acreedor_id,
        monto: Dinero.de(Number(f.monto), moneda),
        ultimaActualizacion: f.ultima_actualizacion,
      }),
    );
  }

  async guardar(deudas: Deuda[]): Promise<void> {
    for (const d of deudas) {
      const { id, monto, ultimaActualizacion } = d.aDatos();
      await this.db.deuda.update({
        where: { id },
        data: { monto: BigInt(monto.monto), ultimaActualizacion },
      });
    }
  }
}

const PERSONA = { select: { id: true, nombre: true, apodo: true } } as const;
const persona = (u: PersonaVista): PersonaVista => ({ id: u.id, nombre: u.nombre, apodo: u.apodo });

export class ConsultaCategoriasPrisma implements ConsultaCategorias {
  constructor(private readonly db: ClientePrisma) {}

  listar(): Promise<CategoriaGasto[]> {
    return this.db.categoriaGasto.findMany({ orderBy: { nombre: 'asc' } });
  }

  async existe(categoriaId: string): Promise<boolean> {
    return (await this.db.categoriaGasto.count({ where: { id: categoriaId } })) > 0;
  }
}

const INCLUIR_GASTO = {
  categoria: true,
  pagadoPor: PERSONA,
  registradoPor: PERSONA,
  partes: { include: { usuario: PERSONA } },
} as const;

export class ConsultaGastosPrisma implements ConsultaGastos {
  constructor(private readonly db: ClientePrisma) {}

  async listar(viajeId: string): Promise<GastoVista[]> {
    const filas = await this.db.gasto.findMany({
      where: { viajeId },
      include: INCLUIR_GASTO,
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
    });
    return filas.map((f) => this.vista(f));
  }

  async obtener(viajeId: string, gastoId: string): Promise<GastoVista | null> {
    const f = await this.db.gasto.findFirst({
      where: { id: gastoId, viajeId },
      include: INCLUIR_GASTO,
    });
    return f ? this.vista(f) : null;
  }

  private vista(f: {
    id: string;
    titulo: string;
    monto: bigint;
    modoDivision: 'IGUALES' | 'ARBITRARIA';
    creadoEn: Date;
    categoria: CategoriaGasto;
    pagadoPor: PersonaVista;
    registradoPor: PersonaVista;
    partes: { monto: bigint; usuario: PersonaVista }[];
  }): GastoVista {
    return {
      id: f.id,
      titulo: f.titulo,
      categoria: { id: f.categoria.id, codigo: f.categoria.codigo, nombre: f.categoria.nombre },
      monto: Number(f.monto),
      modoDivision: f.modoDivision,
      pagadoPor: persona(f.pagadoPor),
      registradoPor: persona(f.registradoPor),
      creadoEn: f.creadoEn.toISOString(),
      // Mayor parte primero y, a igual monto, por nombre: así el resto del reparto queda al principio.
      partes: f.partes
        .map((p) => ({ usuario: persona(p.usuario), monto: Number(p.monto) }))
        .sort((a, b) => b.monto - a.monto || a.usuario.nombre.localeCompare(b.usuario.nombre)),
    };
  }
}

export class ConsultaSaldosPrisma implements ConsultaSaldos {
  constructor(private readonly db: ClientePrisma) {}

  async deudas(viajeId: string, usuarioId: string, rol: RolEnDeuda): Promise<DeudaVista[]> {
    const filas = await this.db.deuda.findMany({
      where: {
        viajeId,
        monto: { gt: 0 },
        ...(rol === 'deudor' ? { deudorId: usuarioId } : { acreedorId: usuarioId }),
      },
      include: { deudor: PERSONA, acreedor: PERSONA },
      orderBy: [{ monto: 'desc' }, { id: 'asc' }],
    });
    return filas.map((f) => ({
      id: f.id,
      contraparte: persona(rol === 'deudor' ? f.acreedor : f.deudor),
      monto: Number(f.monto),
      ultimaActualizacion: f.ultimaActualizacion.toISOString(),
    }));
  }
}
