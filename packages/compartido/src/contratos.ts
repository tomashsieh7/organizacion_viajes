/** Contenido de toda respuesta de error de la API (decisión D19 de PLAN.md). */
export interface CuerpoError {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
}

export interface RespuestaError {
  error: CuerpoError;
}

/** Respuesta de `GET /api/salud`. */
export interface RespuestaSalud {
  ok: true;
}

export type Rol = 'ADMIN' | 'VIAJERO';

export interface Usuario {
  id: string;
  nombre: string;
  apodo: string | null;
}

export interface RespuestaUsuario {
  usuario: Usuario;
}

export interface Moneda {
  codigo: string;
  nombre: string;
  decimales: number;
}

export interface ResumenViaje {
  id: string;
  nombre: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  monedaCodigo: string;
  miRol: Rol;
}

export interface DetalleViaje extends Omit<ResumenViaje, 'monedaCodigo'> {
  moneda: Moneda;
  /** Total que quien consulta debe al resto del grupo, en la unidad mínima de la moneda. */
  miDeudaPendiente: number;
  cantidadParticipantes: number;
}

export interface Participante {
  usuarioId: string;
  nombre: string;
  apodo: string | null;
  rol: Rol;
}

export interface RespuestaBaja {
  bajaConDeuda: boolean;
}
