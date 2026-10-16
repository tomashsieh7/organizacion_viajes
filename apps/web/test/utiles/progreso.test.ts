import { describe, expect, it } from 'vitest';
import type { AlojamientoVista } from '@viajes/compartido';
import { calcularProgreso, cuentaRegresiva } from '../src/utiles/progreso';
import { actividad } from './soporte/clientesFalsos';

const viaje = {
  fechaInicio: '2026-12-10',
  fechaFin: '2026-12-13',
  cantidadParticipantes: 3,
  miDeudaPendiente: 0,
};

function alojamiento(
  fechaDesde: string,
  fechaHasta: string,
  cambios: Partial<AlojamientoVista> = {},
): AlojamientoVista {
  return {
    ...actividad('x', 'x'),
    tipo: 'ALOJAMIENTO',
    estado: 'CONFIRMADA',
    alojamiento: { nombre: 'Cabaña', fechaDesde, fechaHasta },
    ...cambios,
  } as unknown as AlojamientoVista;
}

describe('calcularProgreso', () => {
  it('un viaje recién creado arranca bajo: sin propuestas no hay votos ni decisiones cumplidas', () => {
    const p = calcularProgreso({
      viaje: { ...viaje, cantidadParticipantes: 1 },
      alojamientos: [],
      actividades: [],
    });
    const estado = Object.fromEntries(p.hitos.map((h) => [h.clave, h.hecho]));
    expect(estado).toEqual({
      grupo: false,
      noches: false,
      dias: false,
      resueltas: false,
      votos: false,
      cuentas: true,
    });
    expect(p.porcentaje).toBe(16);
    expect(p.hitos.find((h) => h.clave === 'votos')!.detalle).toBe('Todavía no hay propuestas');
    // RN-C3: del 10 al 13 hay 3 noches (el día de salida no cuenta) y 4 días.
    expect(p.nochesLibres).toEqual(['2026-12-10', '2026-12-11', '2026-12-12']);
    expect(p.diasLibres).toHaveLength(4);
  });

  it('cuenta las noches cubiertas por alojamientos confirmados y los días con actividades confirmadas', () => {
    const p = calcularProgreso({
      viaje,
      alojamientos: [
        alojamiento('2026-12-10', '2026-12-12'),
        alojamiento('2026-12-12', '2026-12-13', { estado: 'PENDIENTE', miVoto: 'A_FAVOR' }),
      ],
      actividades: [
        actividad('a', 'Kayak', { estado: 'CONFIRMADA' }),
        actividad('b', 'Trekking', { estado: 'DENEGADA' }),
      ],
    });
    const noches = p.hitos.find((h) => h.clave === 'noches')!;
    expect([noches.fraccion, noches.detalle, noches.hecho]).toEqual([
      '2/3',
      '1 noche sin lugar',
      false,
    ]);
    const dias = p.hitos.find((h) => h.clave === 'dias')!;
    expect([dias.fraccion, dias.detalle]).toEqual(['1/4', '3 días libres']);
    expect(p.nochesLibres).toEqual(['2026-12-12']);
    // La pendiente ya tiene mi voto, pero sigue sin resolver.
    expect(p.sinMiVoto).toBe(0);
    expect(p.hitos.find((h) => h.clave === 'resueltas')!.detalle).toBe(
      '1 espera la decisión del Admin',
    );
  });

  it('marca los votos que faltan y las deudas pendientes', () => {
    const p = calcularProgreso({
      viaje: { ...viaje, miDeudaPendiente: 500 },
      alojamientos: [],
      actividades: [actividad('a', 'Kayak'), actividad('b', 'Cena')],
    });
    expect(p.sinMiVoto).toBe(2);
    expect(p.hitos.find((h) => h.clave === 'votos')!.detalle).toBe('Te faltan 2');
    expect(p.hitos.find((h) => h.clave === 'cuentas')!.hecho).toBe(false);
  });

  it('llega al 100 % con todo cubierto, resuelto y saldado', () => {
    const p = calcularProgreso({
      viaje: { ...viaje, fechaFin: '2026-12-11' },
      alojamientos: [alojamiento('2026-12-10', '2026-12-11')],
      actividades: [
        actividad('a', 'Kayak', { estado: 'CONFIRMADA' }),
        {
          ...actividad('b', 'Cena', { estado: 'CONFIRMADA' }),
          actividad: { ...actividad('b', 'Cena').actividad, fecha: '2026-12-10' },
        },
      ],
    });
    expect(p.porcentaje).toBe(100);
    expect(p.hitos.every((h) => h.hecho)).toBe(true);
  });
});

describe('cuentaRegresiva', () => {
  it('antes, durante y después del viaje', () => {
    expect(cuentaRegresiva('2026-12-10', '2026-12-16', '2026-10-14')).toEqual({
      etapa: 'antes',
      dias: 57,
      texto: 'Faltan 57 días',
    });
    expect(cuentaRegresiva('2026-12-10', '2026-12-16', '2026-12-09').texto).toBe(
      '¡Empieza mañana!',
    );
    expect(cuentaRegresiva('2026-12-10', '2026-12-16', '2026-12-10')).toEqual({
      etapa: 'durante',
      dia: 1,
      total: 7,
      texto: 'Día 1 de 7',
    });
    expect(cuentaRegresiva('2026-12-10', '2026-12-16', '2026-12-16').texto).toBe('Día 7 de 7');
    expect(cuentaRegresiva('2026-12-10', '2026-12-16', '2026-12-17')).toEqual({
      etapa: 'despues',
      texto: 'Viaje terminado',
    });
  });
});
