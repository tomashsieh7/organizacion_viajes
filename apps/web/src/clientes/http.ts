import type { RespuestaError } from '@viajes/compartido';

/** Error de la API con el formato común (D19). */
export class ErrorDeApi extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorDeApi';
  }

  /** Errores de validación por campo, si los hay. */
  get erroresPorCampo(): Record<string, string> {
    if (!Array.isArray(this.detalles)) return {};
    return Object.fromEntries(
      (this.detalles as { campo: string; mensaje: string }[]).map((d) => [d.campo, d.mensaje]),
    );
  }
}

/** Hace una petición a la API y devuelve el cuerpo JSON, o lanza `ErrorDeApi`. */
export async function pedir<T>(metodo: string, url: string, cuerpo?: unknown): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cuerpo === undefined ? {} : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? null : JSON.stringify(cuerpo),
      credentials: 'same-origin',
    });
  } catch {
    throw new ErrorDeApi(0, 'SIN_CONEXION', 'No se pudo contactar al servidor');
  }
  if (respuesta.status === 204) return undefined as T;
  const datos: unknown = await respuesta.json().catch(() => undefined);
  if (!respuesta.ok) {
    const error = (datos as RespuestaError | undefined)?.error;
    throw new ErrorDeApi(
      respuesta.status,
      error?.codigo ?? 'ERROR_INTERNO',
      error?.mensaje ?? 'Ocurrió un error inesperado',
      error?.detalles,
    );
  }
  return datos as T;
}

/** Mensaje para mostrar de cualquier error. */
export function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado';
}
