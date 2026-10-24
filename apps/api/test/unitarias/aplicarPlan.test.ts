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
  it('RN-V6 y RN-V8: mantiene noches, votos y estado al quitar y devolver fechas', () => {
    const hostel = alojamiento('Hostel', '2026-12-10', '2026-12-13');
    hostel.propuesta.votar('tomas', 'A_FAVOR', AHORA);
    hostel.propuesta.resolver('confirmar', 'ana', AHORA);
    const datos = hostel.propuesta.aDatos();
    aplicarPlan(
      { '2026-12-10': null },
      [hostel],
      RangoFechas.crear('2026-12-10', '2026-12-12'),
      true,
      AHORA,
    );
    expect(hostel.dias).toBeNull();
    expect(hostel.noches).toBe(3);
    hostel.ubicar('2026-12-20', AHORA);
    expect(hostel.dias).toEqual(RangoFechas.crear('2026-12-20', '2026-12-23'));
    expect(hostel.propuesta.aDatos()).toEqual(datos);
    expect(hostel.fechaCambiadaEn).toEqual(AHORA);
  });

  it('RN-V5: compara 1000 planes con un modelo independiente, sin recortar estadías', () => {
    let semilla = 47;
    const azar = (n: number) => (semilla = (semilla * 48271) % 2147483647) % n;
    const dia = (n: number) => `2026-12-${String(n).padStart(2, '0')}`;
    for (let i = 0; i < 1000; i++) {
      const entrada = 10 + azar(6),
        noches = azar(5),
        largo = 1 + azar(9);
      const destino = azar(3) === 0 ? null : 10 + azar(largo);
      const hostel = alojamiento('Hostel', dia(entrada), dia(entrada + noches));
      const plan = { [dia(entrada)]: destino === null ? null : dia(destino) };
      const debeEntrar = destino !== null && destino + noches <= 10 + largo;
      aplicarPlan(plan, [hostel], RangoFechas.crear(dia(10), dia(10 + largo)), true, AHORA);
      expect(hostel.dias?.desde ?? null).toBe(debeEntrar ? dia(destino!) : null);
      expect(hostel.dias?.hasta ?? null).toBe(debeEntrar ? dia(destino! + noches) : null);
      expect(hostel.noches).toBe(noches);
    }
  });
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
