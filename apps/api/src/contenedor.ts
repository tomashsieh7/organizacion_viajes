import type { Config } from './config.js';

/**
 * Punto de composición (Composition Root): el único lugar donde se eligen las
 * implementaciones concretas y se inyectan en los casos de uso. Cada fase agrega acá
 * lo que necesita; por ahora no hay dependencias que componer.
 */
export interface Contenedor {
  config: Config;
}

export function crearContenedor(config: Config): Contenedor {
  return { config };
}
