import type { ResumenPlanificacion } from '@viajes/compartido';
import { cuentaRegresiva } from './progreso';

export function estadoContador(
  inicio: string,
  fin: string,
  hoy: string,
  resumen: ResumenPlanificacion | null | undefined,
) {
  const cuenta = cuentaRegresiva(inicio, fin, hoy);
  if (cuenta.etapa !== 'antes' || !resumen) return { ...cuenta, tono: 'neutro', detalle: '' };
  const {
    nochesSinAlojamiento: noches,
    propuestasPendientes: pendientes,
    propuestasSinDia: sinDia,
  } = resumen;
  if (!noches && !pendientes && !sinDia) return { ...cuenta, tono: 'listo', detalle: 'Todo listo' };
  const partes = [
    noches ? `${noches} ${noches === 1 ? 'noche sin lugar' : 'noches sin lugar'}` : '',
    pendientes ? `${pendientes} por resolver` : '',
    sinDia ? `${sinDia} sin día` : '',
  ].filter(Boolean);
  // 0, 15, 30, 45, 60, 75 y 90% de los últimos 30 días; el detalle no suma categorías solapadas.
  const tramo = Math.floor(((30 - cuenta.dias) * 100) / (30 * 15));
  return {
    ...cuenta,
    tono: cuenta.dias > 30 ? 'neutro' : `urgencia-${tramo}`,
    detalle: partes.join(' · '),
  };
}
