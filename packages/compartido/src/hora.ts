/**
 * Hora `HH:mm` que resulta de sumar minutos a otra; si pasa la medianoche, da vuelta
 * (23:30 + 60 = 00:30). La usan la API para calcular la hora de fin y la web para mostrar conflictos.
 */
export function sumarMinutos(hora: string, minutos: number): string {
  const [h = 0, m = 0] = hora.split(':').map(Number);
  const total = (((h * 60 + m + minutos) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Si una actividad que empieza a `hora` y dura `minutos` termina después de la medianoche. */
export function pasaLaMedianoche(hora: string, minutos: number): boolean {
  const [h = 0, m = 0] = hora.split(':').map(Number);
  return h * 60 + m + minutos > 1440;
}
