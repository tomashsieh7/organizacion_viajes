/** Problema de validación tal como lo informa Zod: el campo afectado y su mensaje. */
interface ProblemaDeValidacion {
  path: PropertyKey[];
  message: string;
}

/** Convierte los problemas de un `safeParse` fallido en un error por campo para el formulario. */
export function erroresDeValidacion(error: {
  issues: ProblemaDeValidacion[];
}): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]));
}

/** Errores por campo de un valor según un esquema de Zod; vacío si el valor es válido. */
export function problemasSegun(
  esquema: {
    safeParse(v: unknown): { success: boolean; error?: { issues: ProblemaDeValidacion[] } };
  },
  valor: unknown,
): Record<string, string> {
  const r = esquema.safeParse(valor);
  return r.success || !r.error ? {} : erroresDeValidacion(r.error);
}
