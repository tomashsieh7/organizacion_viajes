import type { PropuestaVista } from '@viajes/compartido';
import { aMonto } from '../../../compartido/infraestructura/conversiones.js';

/** Fila de propuesta con lo necesario para armar la vista común. */
export interface FilaPropuesta {
  id: string;
  tipo: 'ACTIVIDAD' | 'ALOJAMIENTO';
  estado: PropuestaVista['estado'];
  descripcion: string;
  precio: bigint | null;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  creadaEn: Date;
  resueltaEn: Date | null;
  autor: { id: string; nombre: string };
  votos: { usuarioId: string; valor: 'A_FAVOR' | 'EN_CONTRA' }[];
}

export const INCLUIR_VISTA = { autor: true, votos: true } as const;

/** Arma la vista común de una propuesta; la usan los módulos de cada tipo para sus listados. */
export function aVistaPropuesta(p: FilaPropuesta, usuarioId: string): PropuestaVista {
  return {
    id: p.id,
    tipo: p.tipo,
    estado: p.estado,
    descripcion: p.descripcion,
    precio: p.precio === null ? null : aMonto(p.precio),
    ubicacion: p.ubicacion,
    latitud: p.latitud,
    longitud: p.longitud,
    autor: { usuarioId: p.autor.id, nombre: p.autor.nombre },
    votosAFavor: p.votos.filter((v) => v.valor === 'A_FAVOR').length,
    votosEnContra: p.votos.filter((v) => v.valor === 'EN_CONTRA').length,
    miVoto: p.votos.find((v) => v.usuarioId === usuarioId)?.valor ?? null,
    creadaEn: p.creadaEn.toISOString(),
    resueltaEn: p.resueltaEn?.toISOString() ?? null,
  };
}
