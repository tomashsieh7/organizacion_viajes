/** Fecha `YYYY-MM-DD` del dispositivo, en su zona horaria (P19, D17). */
export function hoyDelDispositivo(ahora: Date = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
}

/** Todos los días entre dos fechas, ambas incluidas. */
export function diasEntre(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  const d = new Date(`${desde}T00:00:00Z`);
  for (let dia = desde; dia <= hasta; dia = d.toISOString().slice(0, 10)) {
    dias.push(dia);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dias;
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "2026-12-11" → "viernes 11/12". */
export function nombreDelDia(fecha: string): string {
  const [, m, d] = fecha.split('-');
  return `${DIAS_SEMANA[new Date(`${fecha}T00:00:00Z`).getUTCDay()]} ${d}/${m}`;
}
