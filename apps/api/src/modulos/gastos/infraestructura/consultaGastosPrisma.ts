import type { CategoriaGasto, GastoVista, PersonaVista } from '@viajes/compartido';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { ConsultaGastos } from '../dominio/puertos.js';
import { persona, PERSONA } from './filasPrisma.js';

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
