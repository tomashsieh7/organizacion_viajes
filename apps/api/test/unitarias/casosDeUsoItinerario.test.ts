import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConsultarCronograma,
  ConsultarMapa,
} from '../../src/modulos/itinerario/casos-de-uso/casosDeUsoItinerario.js';
import { RecorridoEnLineaRecta } from '../../src/modulos/itinerario/dominio/recorrido.js';
import {
  baseVacia,
  ConsultaItinerarioEnMemoria,
  propuestaDePrueba,
  RepositorioViajesEnMemoria,
  type BaseEnMemoria,
} from '../soporte/memoria.js';

const VIAJE = 'v1';
let base: BaseEnMemoria;

beforeEach(() => {
  base = baseVacia();
  base.viajes.push({
    id: VIAJE,
    nombre: 'Bariloche',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-13',
    monedaCodigo: 'ARS',
    creadoPorId: 'ana',
    creadoEn: new Date(),
    membresias: [],
  });
});

function actividad(
  titulo: string,
  fecha: string,
  horaInicio: string,
  estado: 'CONFIRMADA' | 'PENDIENTE' = 'CONFIRMADA',
  latitud = -41,
) {
  const fila = propuestaDePrueba({ viajeId: VIAJE, autorId: 'ana', estado });
  fila.datos.tipo = 'ACTIVIDAD';
  fila.datos.latitud = latitud;
  fila.datos.longitud = -71;
  base.propuestas.push({
    ...fila,
    actividad: { titulo, fecha, horaInicio, duracionMin: 60, alternativaDeId: null },
  });
  return fila.datos.id;
}

function alojamiento(nombre: string, fechaDesde: string, fechaHasta: string) {
  const fila = propuestaDePrueba({ viajeId: VIAJE, autorId: 'ana', estado: 'CONFIRMADA' });
  base.propuestas.push({ ...fila, alojamiento: { nombre, fechaDesde, fechaHasta } });
  return fila.datos.id;
}

const cronograma = () =>
  new ConsultarCronograma(
    new RepositorioViajesEnMemoria(base),
    new ConsultaItinerarioEnMemoria(base),
  ).ejecutar(VIAJE);
const mapa = (hoy: string, dia?: string) =>
  new ConsultarMapa(
    new RepositorioViajesEnMemoria(base),
    new ConsultaItinerarioEnMemoria(base),
    new RecorridoEnLineaRecta(),
  ).ejecutar(VIAJE, hoy, dia);

describe('CU16: cronograma', () => {
  it('RN-C1: incluye todos los días del viaje, también los vacíos', async () => {
    const { dias } = await cronograma();
    expect(dias.map((d) => d.fecha)).toEqual([
      '2026-12-10',
      '2026-12-11',
      '2026-12-12',
      '2026-12-13',
    ]);
    expect(dias.every((d) => d.actividades.length === 0 && d.alojamientos.length === 0)).toBe(true);
  });

  it('RN-C2: cada día trae solo sus confirmadas, ordenadas por horario', async () => {
    actividad('Cena', '2026-12-11', '21:00');
    actividad('Kayak', '2026-12-11', '10:00');
    actividad('Propuesta', '2026-12-11', '12:00', 'PENDIENTE');
    actividad('Museo', '2026-12-12', '15:00');
    const { dias } = await cronograma();
    expect(dias[1]!.actividades.map((a) => [a.titulo, a.horaInicio, a.horaFin])).toEqual([
      ['Kayak', '10:00', '11:00'],
      ['Cena', '21:00', '22:00'],
    ]);
    expect(dias[2]!.actividades.map((a) => a.titulo)).toEqual(['Museo']);
    expect(dias[0]!.actividades).toEqual([]);
  });

  it('RN-C3: el alojamiento de cada noche, sin contar el día de salida', async () => {
    const hostel = alojamiento('Hostel', '2026-12-10', '2026-12-12');
    const cabana = alojamiento('Cabaña', '2026-12-12', '2026-12-13');
    const { dias } = await cronograma();
    expect(dias.map((d) => d.alojamientos.map((a) => a.id))).toEqual([
      [hostel],
      [hostel],
      [cabana],
      [],
    ]);
    expect(dias[0]!.alojamientos[0]).toEqual({ id: hostel, nombre: 'Hostel', ubicacion: 'y' });
  });

  it('responde NO_ENCONTRADO si el viaje no existe', async () => {
    await expect(
      new ConsultarCronograma(
        new RepositorioViajesEnMemoria(base),
        new ConsultaItinerarioEnMemoria(base),
      ).ejecutar('otro'),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
  });
});

describe('CU17: mapa del día', () => {
  it('RN-M1: sin día elegido y hoy fuera del viaje, abre el primer día con actividades', async () => {
    actividad('Museo', '2026-12-12', '15:00');
    const r = await mapa('2026-09-24');
    expect(r.dia).toBe('2026-12-12');
    expect(r.diasConActividad).toEqual(['2026-12-12']);
    expect(r.aviso).toBeNull();
  });

  it('RN-M1 y RN-M3: hoy dentro del viaje sin actividades, abre hoy con el aviso', async () => {
    actividad('Museo', '2026-12-12', '15:00');
    const r = await mapa('2026-12-11');
    expect(r).toMatchObject({ dia: '2026-12-11', actividades: [], recorrido: [] });
    expect(r.aviso).toBe('SIN_ACTIVIDADES_CONFIRMADAS');
  });

  it('RN-M1: sin ninguna confirmada, abre el primer día del viaje con el aviso', async () => {
    actividad('Propuesta', '2026-12-12', '15:00', 'PENDIENTE');
    const r = await mapa('2027-01-01');
    expect(r).toMatchObject({ dia: '2026-12-10', diasConActividad: [] });
    expect(r.aviso).toBe('SIN_ACTIVIDADES_CONFIRMADAS');
  });

  it('RN-M2, RN-M4 y RN-M6: actividades del día en orden y recorrido en ese orden', async () => {
    actividad('Cena', '2026-12-11', '21:00', 'CONFIRMADA', -41.3);
    actividad('Kayak', '2026-12-11', '10:00', 'CONFIRMADA', -41.1);
    actividad('Almuerzo', '2026-12-11', '13:00', 'CONFIRMADA', -41.2);
    actividad('Otro día', '2026-12-12', '10:00');
    const r = await mapa('2026-09-24', '2026-12-11');
    expect(r.actividades.map((a) => a.titulo)).toEqual(['Kayak', 'Almuerzo', 'Cena']);
    expect(r.recorrido.map((p) => p.latitud)).toEqual([-41.1, -41.2, -41.3]);
  });

  it('RN-M7: el día elegido tiene que estar dentro del viaje', async () => {
    await expect(mapa('2026-12-11', '2026-12-14')).rejects.toMatchObject({
      codigo: 'FUERA_DEL_VIAJE',
      detalles: { desde: '2026-12-10', hasta: '2026-12-13' },
    });
  });
});
