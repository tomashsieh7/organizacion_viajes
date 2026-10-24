import type { AlojamientoVista, EstadoPropuesta } from '@viajes/compartido';
import { aFecha } from '../../../comun/infraestructura/conversiones.js';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import {
  aVistaPropuesta,
  INCLUIR_VISTA,
  type FilaPropuesta,
} from '../../propuestas/infraestructura/vistaPropuesta.js';
import type { ConsultaAlojamientos } from '../dominio/puertos.js';

const INCLUIR = { ...INCLUIR_VISTA, alojamiento: true } as const;

function aVista(
  f: FilaPropuesta & {
    alojamiento: {
      nombre: string;
      fechaDesde: Date | null;
      fechaHasta: Date | null;
      noches: number;
      fechaCambiadaEn: Date | null;
    } | null;
  },
  usuarioId: string,
): AlojamientoVista | null {
  if (!f.alojamiento) return null;
  return {
    ...aVistaPropuesta(f, usuarioId),
    tipo: 'ALOJAMIENTO',
    fechaCambiadaEn: f.alojamiento.fechaCambiadaEn?.toISOString() ?? null,
    alojamiento: {
      nombre: f.alojamiento.nombre,
      fechaDesde: f.alojamiento.fechaDesde ? aFecha(f.alojamiento.fechaDesde) : null,
      fechaHasta: f.alojamiento.fechaHasta ? aFecha(f.alojamiento.fechaHasta) : null,
      noches: f.alojamiento.noches,
    },
  };
}

export class ConsultaAlojamientosPrisma implements ConsultaAlojamientos {
  constructor(private readonly db: ClientePrisma) {}

  async listar(
    viajeId: string,
    usuarioId: string,
    estado?: EstadoPropuesta,
  ): Promise<AlojamientoVista[]> {
    const filas = await this.db.propuesta.findMany({
      where: { viajeId, tipo: 'ALOJAMIENTO', ...(estado ? { estado } : {}) },
      include: INCLUIR,
      orderBy: [{ alojamiento: { fechaDesde: 'asc' } }, { creadaEn: 'asc' }],
    });
    return filas.flatMap((f) => aVista(f, usuarioId) ?? []);
  }

  async obtener(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<AlojamientoVista | null> {
    const f = await this.db.propuesta.findFirst({
      where: { id: propuestaId, viajeId, tipo: 'ALOJAMIENTO' },
      include: INCLUIR,
    });
    return f ? aVista(f, usuarioId) : null;
  }
}
