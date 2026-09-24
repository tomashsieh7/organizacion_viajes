import { z } from 'zod';

const esquema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ORIGEN_WEB: z.url().default('http://localhost:5173'),
});

export type Config = z.infer<typeof esquema>;

/** Lee y valida las variables de entorno; si falta o sobra algo inválido, corta el arranque. */
export function leerConfig(entorno: NodeJS.ProcessEnv = process.env): Config {
  const resultado = esquema.safeParse(entorno);
  if (!resultado.success) {
    throw new Error(`Configuración inválida: ${z.prettifyError(resultado.error)}`);
  }
  return resultado.data;
}
