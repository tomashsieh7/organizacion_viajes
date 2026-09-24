import { z } from 'zod';

const esquema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ORIGEN_WEB: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).default('postgresql://viajes:viajes@localhost:5432/viajes'),
  SESION_DIAS: z.coerce.number().int().positive().default(7),
  // Solo las pruebas de punta a punta lo suben, porque registran muchos usuarios desde la misma IP.
  REGISTROS_POR_HORA: z.coerce.number().int().positive().default(10),
});

export type Config = z.infer<typeof esquema>;

/** Lee y valida las variables de entorno; si algo es inválido, corta el arranque. */
export function leerConfig(entorno: NodeJS.ProcessEnv = process.env): Config {
  const resultado = esquema.safeParse(entorno);
  if (!resultado.success) {
    throw new Error(`Configuración inválida: ${z.prettifyError(resultado.error)}`);
  }
  return resultado.data;
}
