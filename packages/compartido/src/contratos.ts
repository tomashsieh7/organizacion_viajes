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
