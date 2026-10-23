import { describe, expect, it } from 'vitest';
import { Coordenadas } from '../../src/comun/valores/coordenadas.js';
import { RangoFechas } from '../../src/comun/valores/rangoFechas.js';
import { Actividad } from '../../src/modulos/actividades/dominio/actividad.js';
import { Alojamiento } from '../../src/modulos/alojamientos/dominio/alojamiento.js';
import { Propuesta } from '../../src/modulos/propuestas/dominio/propuesta.js';
import { aplicarPlan } from '../../src/modulos/viajes/dominio/reacomodo.js';

const AHORA = new Date('2026-09-24T12:00:00Z');
const UNA_SEMANA = {
  '2026-12-10': '2026-12-17',
  '2026-12-11': '2026-12-18',
  '2026-12-12': '2026-12-19',
  '2026-12-13': '2026-12-20',
  '2026-12-14': '2026-12-21',
  '2026-12-15': '2026-12-22',
  '2026-12-16': '2026-12-23',
};

const actividad = (titulo: string, fecha: string) =>
  Actividad.proponer({
    id: crypto.randomUUID(),
    viajeId: 'v1',
    autorId: 'ana',
    titulo,
    descripcion: '',
    ubicacion: 'Lago',
    coordenadas: Coordenadas.crear(-41.1, -71.4),
    fecha,
    horaInicio: '10:00',
    duracionMin: 60,
    ahora: AHORA,
  });

const alojamiento = (nombre: string, desde: string, hasta: string) =>
  Alojamiento.reconstruir(
    Propuesta.proponer({
      id: crypto.randomUUID(),
      viajeId: 'v1',
      autorId: 'ana',
      tipo: 'ALOJAMIENTO',
      descripcion: '',
      ubicacion: 'Centro',
      coordenadas: null,
      ahora: AHORA,
    }),
    { nombre, estadia: RangoFechas.crear(desde, hasta) },
  );

describe('RN-V2 y RN-V3: aplicar el plan de reacomodo', () => {
  it('RN-V2: cada propuesta se mueve a su manera y conserva votos y estado', () => {
    const kayak = actividad('Kayak', '2026-12-11');
    kayak.propuesta.votar('tomas', 'A_FAVOR', AHORA);
    kayak.propuesta.resolver('confirmar', 'ana', AHORA);
    const hostel = alojamiento('Hostel', '2026-12-14', '2026-12-16');
    const antes = kayak.propuesta.aDatos();

    const movidas = aplicarPlan(
      UNA_SEMANA,
      [kayak, hostel],
      RangoFechas.crear('2026-12-17', '2026-12-23'),
    );

    expect(movidas).toEqual([kayak, hostel]);
    expect(kayak.detalle).toMatchObject({ fecha: '2026-12-18', horaInicio: '10:00' });
    expect(hostel.dias).toEqual(RangoFechas.crear('2026-12-21', '2026-12-23'));
    expect(kayak.propuesta.aDatos()).toEqual(antes);
  });

  it('RN-V2: devuelve solo las que cambiaron de día', () => {
    const kayak = actividad('Kayak', '2026-12-11');
    expect(aplicarPlan({}, [kayak], RangoFechas.crear('2026-12-10', '2026-12-20'))).toEqual([]);
  });

  it('RN-V3: si una pendiente o confirmada queda afuera no mueve nada y las informa', () => {
    const kayak = actividad('Kayak', '2026-12-15');
    const hostel = alojamiento('Hostel', '2026-12-12', '2026-12-14');
    const trekking = actividad('Trekking', '2026-12-11');
    let error: unknown;
    try {
      aplicarPlan(
        { '2026-12-11': '2026-12-12' },
        [kayak, hostel, trekking],
        RangoFechas.crear('2026-12-10', '2026-12-13'),
      );
    } catch (e) {
      error = e;
    }
    expect(error).toMatchObject({
      codigo: 'REACOMODO_NECESARIO',
      detalles: {
        propuestas: [
          {
            id: kayak.id,
            tipo: 'ACTIVIDAD',
            titulo: 'Kayak',
            desde: '2026-12-15',
            hasta: '2026-12-15',
          },
          {
            id: hostel.id,
            tipo: 'ALOJAMIENTO',
            titulo: 'Hostel',
            desde: '2026-12-12',
            hasta: '2026-12-14',
          },
        ],
      },
    });
    expect(trekking.detalle.fecha).toBe('2026-12-11');
  });

  it('RN-V3: las denegadas y canceladas no impiden el cambio y se mueven igual', () => {
    const denegada = actividad('Kayak', '2026-12-15');
    denegada.propuesta.resolver('denegar', 'ana', AHORA);
    const cancelada = actividad('Cena', '2026-12-16');
    cancelada.propuesta.resolver('confirmar', 'ana', AHORA);
    cancelada.propuesta.resolver('cancelar', 'ana', AHORA);
    const viaje = RangoFechas.crear('2026-12-10', '2026-12-13');
    expect(aplicarPlan({}, [denegada, cancelada], viaje)).toEqual([]);
    expect(aplicarPlan({ '2026-12-15': '2026-12-12' }, [denegada, cancelada], viaje)).toEqual([
      denegada,
    ]);
  });
});
