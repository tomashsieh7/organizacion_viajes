import type { UnidadDeTrabajo } from '../../src/compartido/unidadDeTrabajo.js';

/**
 * Implementación en memoria de `UnidadDeTrabajo` para las pruebas unitarias de casos de uso.
 * Cada trabajo opera sobre una copia del estado, que reemplaza al confirmado solo si el
 * trabajo termina sin errores. Los trabajos se ejecutan de a uno, como transacciones serializadas.
 */
export class UnidadDeTrabajoEnMemoria<E, R> implements UnidadDeTrabajo<R> {
  private cola: Promise<unknown> = Promise.resolve();

  constructor(
    private estado: E,
    private readonly crearRepositorios: (estado: E) => R,
  ) {}

  /** Copia del estado confirmado, para verificar resultados en las pruebas. */
  get confirmado(): E {
    return structuredClone(this.estado);
  }

  ejecutar<T>(trabajo: (repositorios: R) => Promise<T>): Promise<T> {
    const corrida = this.cola.then(async () => {
      const copia = structuredClone(this.estado);
      const resultado = await trabajo(this.crearRepositorios(copia));
      this.estado = copia;
      return resultado;
    });
    this.cola = corrida.catch(() => undefined);
    return corrida;
  }
}
