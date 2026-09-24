/**
 * Agrupa las lecturas y escrituras de un caso de uso en una transacción (patrón Unit of Work).
 * `R` es el conjunto de repositorios que el caso de uso puede usar dentro de la transacción.
 * Si `trabajo` lanza un error, nada de lo que escribió queda guardado y el error se propaga.
 */
export interface UnidadDeTrabajo<R> {
  ejecutar<T>(trabajo: (repositorios: R) => Promise<T>): Promise<T>;
}
