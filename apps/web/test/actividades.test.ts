import { describe, expect, it } from 'vitest';
import { agruparOpciones } from '../src/utiles/actividades';
import { formatearDuracion, formatearHorario } from '../src/utiles/formato';
import { actividad } from './soporte/clientesFalsos';

describe('agruparOpciones (P9)', () => {
  it('anida cada alternativa debajo de su original, respetando el orden', () => {
    const kayak = actividad('k', 'Kayak');
    const cena = actividad('c', 'Cena', { horaInicio: '21:00' });
    const trekking = actividad('t', 'Trekking', { alternativaDe: { id: 'k', titulo: 'Kayak' } });
    const grupos = agruparOpciones([kayak, trekking, cena]);
    expect(grupos.map((g) => [g.actividad.id, g.alternativas.map((a) => a.id)])).toEqual([
      ['k', ['t']],
      ['c', []],
    ]);
  });

  it('si el filtro deja afuera a la original, la alternativa se muestra sola', () => {
    const trekking = actividad('t', 'Trekking', { alternativaDe: { id: 'k', titulo: 'Kayak' } });
    expect(agruparOpciones([trekking])).toEqual([{ actividad: trekking, alternativas: [] }]);
  });
});

describe('formato de actividades', () => {
  it('muestra la duración en horas y minutos', () => {
    expect(formatearDuracion(150)).toBe('2 h 30 min');
    expect(formatearDuracion(60)).toBe('1 h');
    expect(formatearDuracion(45)).toBe('45 min');
  });

  it('avisa cuando la actividad termina al día siguiente', () => {
    expect(formatearHorario({ fecha: '2026-12-11', horaInicio: '10:00', duracionMin: 120 })).toBe(
      '11/12/2026 · 10:00 a 12:00',
    );
    expect(formatearHorario({ fecha: '2026-12-11', horaInicio: '23:30', duracionMin: 90 })).toBe(
      '11/12/2026 · 23:30 a 01:00 del día siguiente',
    );
  });
});
