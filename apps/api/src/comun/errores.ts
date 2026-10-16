/**
 * Categorías de error del dominio. La capa HTTP las traduce a códigos de estado,
 * así el dominio no depende de HTTP y un código nuevo no obliga a tocar esa traducción.
 */
export type CategoriaError =
  | 'VALIDACION'
  | 'NO_AUTENTICADO'
  | 'PROHIBIDO'
  | 'NO_ENCONTRADO'
  | 'CONFLICTO'
  | 'REGLA_DE_NEGOCIO'
  | 'DEMASIADOS_INTENTOS';

/** Error esperable de una regla de negocio, con un código estable (decisión D19). */
export class ErrorDeDominio extends Error {
  constructor(
    readonly categoria: CategoriaError,
    readonly codigo: string,
    mensaje: string,
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorDeDominio';
  }
}
