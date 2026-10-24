import { describe, expect, it } from 'vitest';
import { sumarDias } from '@viajes/compartido';
import { estadoContador } from '../../src/utiles/contador';
const hoy = '2026-11-01';
const pendiente = { nochesSinAlojamiento: 2, propuestasPendientes: 3, propuestasSinDia: 1 };
const listo = { nochesSinAlojamiento: 0, propuestasPendientes: 0, propuestasSinDia: 0 };
const calcular = (dias: number, resumen = pendiente) => {
  const inicio = sumarDias(hoy, dias);
  return estadoContador(inicio, sumarDias(inicio, 5), hoy, resumen);
};
describe('Contador de urgencia', () => {
  it.each([
    [31, 'neutro'],
    [30, 'urgencia-0'],
    [26, 'urgencia-0'],
    [25, 'urgencia-1'],
    [22, 'urgencia-1'],
    [21, 'urgencia-2'],
    [17, 'urgencia-2'],
    [16, 'urgencia-3'],
    [13, 'urgencia-3'],
    [12, 'urgencia-4'],
    [8, 'urgencia-4'],
    [7, 'urgencia-5'],
    [4, 'urgencia-5'],
    [3, 'urgencia-6'],
    [1, 'urgencia-6'],
  ] as const)('a %i días muestra %s', (dias, tono) => expect(calcular(dias).tono).toBe(tono));
  it.each([90, 31, 30, 25, 21, 16, 12, 7, 3, 1])('Todo listo siempre es verde a %i días', (dias) =>
    expect(calcular(dias, listo)).toMatchObject({ tono: 'listo', detalle: 'Todo listo' }),
  );
  it('explica categorías sin sumarlas y bloquea listo por cada causa', () => {
    expect(calcular(5).detalle).toBe('2 noches sin lugar · 3 por resolver · 1 sin día');
    for (const clave of Object.keys(listo))
      expect(calcular(5, { ...listo, [clave]: 1 }).tono).toBe('urgencia-5');
  });
  it('datos desconocidos y acceso solo saldos quedan neutros', () => {
    for (const r of [undefined, null])
      expect(estadoContador('2026-11-02', '2026-11-06', hoy, r)).toMatchObject({
        tono: 'neutro',
        detalle: '',
      });
  });
  it('conserva durante y después sin advertencias previas', () => {
    expect(calcular(0)).toMatchObject({ tono: 'neutro', texto: 'Día 1 de 6', detalle: '' });
    expect(calcular(-10)).toMatchObject({ tono: 'neutro', texto: 'Viaje terminado', detalle: '' });
  });
});
