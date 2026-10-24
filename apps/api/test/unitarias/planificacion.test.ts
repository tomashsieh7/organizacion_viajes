import { describe, expect, it } from 'vitest';
import {
  resumirPlanificacion,
  sumarDias,
  type PropuestaParaPlanificacion,
} from '@viajes/compartido';

const viaje = { fechaInicio: '2028-02-27', fechaFin: '2028-03-03' };
const hotel = (
  desde: string | null,
  hasta: string | null,
  estado: PropuestaParaPlanificacion['estado'] = 'CONFIRMADA',
): PropuestaParaPlanificacion => ({
  estado,
  alojamiento: { fechaDesde: desde, fechaHasta: hasta },
});

describe('Resumen de planificación del contador', () => {
  it('cubre noches exclusivas, fusiona solapamientos y no cuenta pendientes o finales', () => {
    expect(
      resumirPlanificacion(viaje, [
        hotel('2028-02-27', '2028-02-29'),
        hotel('2028-02-28', '2028-03-01'),
        hotel('2028-03-02', '2028-03-03'),
        hotel('2028-03-01', '2028-03-02', 'PENDIENTE'),
        hotel('2028-03-01', '2028-03-02', 'CANCELADA'),
      ]),
    ).toEqual({ nochesSinAlojamiento: 1, propuestasPendientes: 1, propuestasSinDia: 0 });
  });
  it('RN-V6: Sin día confirmado o pendiente bloquea Todo listo; finales no cuentan', () => {
    expect(
      resumirPlanificacion(viaje, [
        hotel(null, null),
        { estado: 'PENDIENTE', actividad: { fecha: null } },
        hotel(null, null, 'DENEGADA'),
      ]),
    ).toEqual({ nochesSinAlojamiento: 5, propuestasPendientes: 1, propuestasSinDia: 2 });
  });
  it('viaje de un día no necesita noches; recorta rangos al viaje', () => {
    expect(
      resumirPlanificacion({ fechaInicio: viaje.fechaInicio, fechaFin: viaje.fechaInicio }, [])
        .nochesSinAlojamiento,
    ).toBe(0);
    expect(
      resumirPlanificacion(viaje, [hotel('2028-01-01', '2028-04-01')]).nochesSinAlojamiento,
    ).toBe(0);
  });
  it('compara 1000 agendas aleatorias con cobertura independiente por noche', () => {
    let semilla = 2026;
    const azar = (n: number) => {
      semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0;
      return semilla % n;
    };
    for (let caso = 0; caso < 1000; caso++) {
      const noches = azar(366);
      const v = { fechaInicio: '2027-12-01', fechaFin: sumarDias('2027-12-01', noches) };
      const propuestas = Array.from({ length: azar(100) }, () => {
        const inicio = azar(400) - 15;
        return hotel(
          sumarDias(v.fechaInicio, inicio),
          sumarDias(v.fechaInicio, inicio + azar(40) + 1),
          azar(2) ? 'CONFIRMADA' : 'PENDIENTE',
        );
      });
      const libres = Array.from({ length: noches }, (_, i) => sumarDias(v.fechaInicio, i)).filter(
        (n) =>
          !propuestas.some(
            (p) =>
              p.estado === 'CONFIRMADA' &&
              p.alojamiento!.fechaDesde! <= n &&
              n < p.alojamiento!.fechaHasta!,
          ),
      ).length;
      expect(resumirPlanificacion(v, propuestas).nochesSinAlojamiento).toBe(libres);
    }
  });
});
