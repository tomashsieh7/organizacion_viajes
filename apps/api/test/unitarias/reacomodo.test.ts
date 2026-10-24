import { describe, expect, it } from 'vitest';
import {
  diasEntre,
  elegirPlan,
  esquemaDatosViaje,
  moverDia,
  moverRango,
  planCorriendoSemanas,
  planDiasQueQuedan,
  planSinCambios,
  quedanAfuera,
  sumarDias,
  type OcupacionDelViaje,
  type RangoDeDias,
} from '@viajes/compartido';

// Jueves 10 a miércoles 16 de diciembre de 2026.
const viaje: RangoDeDias = { desde: '2026-12-10', hasta: '2026-12-16' };
const nada: OcupacionDelViaje = [];
/** Una actividad ocupa un solo día. */
const delDia = (dia: string) => ({ desde: dia, hasta: dia });
const conActividades = (...dias: string[]): OcupacionDelViaje => dias.map(delDia);
const diaDeLaSemana = (dia: string) => new Date(`${dia}T00:00:00Z`).getUTCDay();

describe('RN-V5: elección manual de días', () => {
  it('valida los destinos efectivos y conserva la elección explícita Sin día', () => {
    expect(planDiasQueQuedan(viaje, viaje, { '2026-12-11': '2026-12-12' })).toBeNull();
    expect(
      planDiasQueQuedan(viaje, viaje, { '2026-12-11': '2026-12-12', '2026-12-12': null }),
    ).toEqual({ '2026-12-11': '2026-12-12', '2026-12-12': null });
    expect(moverDia({ '2026-12-11': null }, '2026-12-11')).toBeNull();
    expect(
      moverRango({ '2026-12-11': null }, { desde: '2026-12-11', hasta: '2026-12-13' }),
    ).toBeNull();
    expect(planDiasQueQuedan(viaje, viaje, { '2026-12-09': null })).toBeNull();
    expect(planDiasQueQuedan(viaje, viaje, { '2026-12-11': '2026-12-20' })).toBeNull();
  });
});

describe('Días', () => {
  it('suma y cuenta días cruzando de mes, de año y el 29 de febrero', () => {
    expect(sumarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
    expect(sumarDias('2028-03-01', -1)).toBe('2028-02-29');
    expect(diasEntre('2028-02-27', '2028-03-01')).toBe(3);
    expect(diasEntre('2026-12-16', '2026-12-10')).toBe(-6);
  });
});

describe('Armadores de plan (D26)', () => {
  it('sin cambios no mueve ningún día', () => {
    const plan = planSinCambios(viaje, { desde: '2026-12-01', hasta: '2026-12-31' });
    expect(moverDia(plan!, '2026-12-12')).toBe('2026-12-12');
  });

  it('corriendo semanas lleva cada día al mismo día de la semana, hacia adelante o hacia atrás', () => {
    const adelante = planCorriendoSemanas(viaje, { desde: '2026-12-17', hasta: '2026-12-23' })!;
    expect(moverDia(adelante, '2026-12-10')).toBe('2026-12-17');
    expect(moverDia(adelante, '2026-12-16')).toBe('2026-12-23');
    const atras = planCorriendoSemanas(viaje, { desde: '2026-11-26', hasta: '2026-12-02' })!;
    expect(moverDia(atras, '2026-12-13')).toBe('2026-11-29');
    expect(Object.keys(atras)).toHaveLength(7);
  });

  it('corriendo semanas no corresponde si el comienzo no se corre o no se corre semanas enteras', () => {
    expect(planCorriendoSemanas(viaje, { desde: '2026-12-10', hasta: '2026-12-20' })).toBeNull();
    expect(planCorriendoSemanas(viaje, { desde: '2026-12-13', hasta: '2026-12-19' })).toBeNull();
    expect(planCorriendoSemanas(viaje, { desde: '2026-12-09', hasta: '2026-12-15' })).toBeNull();
  });

  it('un alojamiento se mueve por su día de entrada y conserva las noches', () => {
    const plan = planCorriendoSemanas(viaje, { desde: '2026-12-24', hasta: '2026-12-30' })!;
    expect(moverRango(plan, { desde: '2026-12-14', hasta: '2026-12-16' })).toEqual({
      desde: '2026-12-28',
      hasta: '2026-12-30',
    });
    // Con un plan que no toca el día de entrada, la estadía queda igual.
    expect(moverRango({}, { desde: '2026-12-14', hasta: '2026-12-16' })).toEqual({
      desde: '2026-12-14',
      hasta: '2026-12-16',
    });
  });
});

describe('RN-V2 y RN-V3: elección del plan automático', () => {
  it('RN-V3: lista lo que queda afuera de las fechas nuevas, incluido un alojamiento que sale después', () => {
    const despues = { desde: '2026-12-11', hasta: '2026-12-14' };
    const ocupacion = [
      delDia('2026-12-10'),
      delDia('2026-12-12'),
      { desde: '2026-12-13', hasta: '2026-12-15' },
    ];
    expect(quedanAfuera({}, despues, ocupacion)).toEqual([ocupacion[0], ocupacion[2]]);
  });

  it('RN-V2: con las mismas fechas no se mueve nada', () => {
    expect(elegirPlan(viaje, viaje, conActividades('2026-12-12'))).toEqual({
      plan: {},
      semanas: 0,
    });
  });

  it('RN-V2: corrido una o dos semanas enteras con el mismo largo, todo se corre igual', () => {
    const una = elegirPlan(viaje, { desde: '2026-12-17', hasta: '2026-12-23' }, nada)!;
    expect(una.semanas).toBe(1);
    expect(moverDia(una.plan, '2026-12-12')).toBe('2026-12-19');
    const dosAtras = elegirPlan(
      viaje,
      { desde: '2026-11-26', hasta: '2026-12-02' },
      conActividades('2026-12-13'),
    )!;
    expect(dosAtras.semanas).toBe(-2);
    expect(moverDia(dosAtras.plan, '2026-12-13')).toBe('2026-11-29');
  });

  it('RN-V2: corrido semanas enteras pero solapado con las fechas viejas, se corre igual para conservar el día de la semana', () => {
    const elegido = elegirPlan(
      viaje,
      { desde: '2026-12-17', hasta: '2026-12-23' },
      conActividades('2026-12-16'),
    )!;
    expect(elegido.semanas).toBe(1);
    expect(moverDia(elegido.plan, '2026-12-16')).toBe('2026-12-23');
  });

  it('RN-V2: alargado por delante o por detrás, nada se mueve', () => {
    const ocupacion: OcupacionDelViaje = [
      delDia('2026-12-10'),
      delDia('2026-12-16'),
      { desde: '2026-12-10', hasta: '2026-12-16' },
    ];
    for (const despues of [
      { desde: '2026-12-10', hasta: '2026-12-20' },
      { desde: '2026-12-07', hasta: '2026-12-16' },
      { desde: '2026-12-03', hasta: '2026-12-16' },
      { desde: '2026-12-03', hasta: '2026-12-23' },
    ]) {
      expect(elegirPlan(viaje, despues, ocupacion)).toEqual({ plan: {}, semanas: 0 });
    }
  });

  it('RN-V2: achicado justo hasta lo que está ocupado, nada se mueve', () => {
    const ocupacion: OcupacionDelViaje = [
      delDia('2026-12-11'),
      { desde: '2026-12-12', hasta: '2026-12-14' },
    ];
    expect(elegirPlan(viaje, { desde: '2026-12-11', hasta: '2026-12-14' }, ocupacion)).toEqual({
      plan: {},
      semanas: 0,
    });
  });

  it('RN-V3: achicado dejando una actividad o el día de salida de un alojamiento afuera, no hay plan', () => {
    const despues = { desde: '2026-12-11', hasta: '2026-12-14' };
    expect(elegirPlan(viaje, despues, conActividades('2026-12-10'))).toBeNull();
    expect(elegirPlan(viaje, despues, conActividades('2026-12-15'))).toBeNull();
    expect(elegirPlan(viaje, despues, [{ desde: '2026-12-13', hasta: '2026-12-15' }])).toBeNull();
  });

  it('RN-V2: corrido una semana y alargado, si sin mover algo queda afuera se corre todo', () => {
    const elegido = elegirPlan(
      viaje,
      { desde: '2026-12-17', hasta: '2026-12-26' },
      conActividades('2026-12-10', '2026-12-16'),
    )!;
    expect(elegido.semanas).toBe(1);
    expect(moverDia(elegido.plan, '2026-12-10')).toBe('2026-12-17');
  });

  it('RN-V3: corrido días sueltos con cosas que quedan afuera, no hay plan', () => {
    expect(
      elegirPlan(viaje, { desde: '2026-12-13', hasta: '2026-12-19' }, conActividades('2026-12-11')),
    ).toBeNull();
  });

  it('RN-V2: corrido días sueltos sin nada afuera, nada se mueve', () => {
    expect(
      elegirPlan(viaje, { desde: '2026-12-13', hasta: '2026-12-19' }, conActividades('2026-12-14')),
    ).toEqual({ plan: {}, semanas: 0 });
  });

  it('RN-V2: corrido una semana cruzando el 29 de febrero, cada día conserva el de la semana', () => {
    const antes = { desde: '2028-02-24', hasta: '2028-03-01' };
    const elegido = elegirPlan(antes, { desde: '2028-03-02', hasta: '2028-03-08' }, [
      delDia('2028-02-29'),
      { desde: '2028-02-27', hasta: '2028-03-01' },
    ])!;
    expect(moverDia(elegido.plan, '2028-02-29')).toBe('2028-03-07');
    expect(moverRango(elegido.plan, { desde: '2028-02-27', hasta: '2028-03-01' })).toEqual({
      desde: '2028-03-05',
      hasta: '2028-03-08',
    });
  });

  it('RN-V2 y RN-V3: con fechas y ocupaciones al azar, el plan elegido coincide con un modelo propio', () => {
    let semilla = 20261023;
    const azar = (n: number) => {
      semilla = (semilla * 1103515245 + 12345) % 2 ** 31;
      return semilla % n;
    };
    const base = '2026-12-01';
    for (let vuelta = 0; vuelta < 2000; vuelta++) {
      const antes = { desde: sumarDias(base, azar(30)), hasta: '' };
      antes.hasta = sumarDias(antes.desde, azar(15));
      const despues = { desde: sumarDias(base, azar(50) - 10), hasta: '' };
      despues.hasta = sumarDias(despues.desde, azar(20));
      const largo = diasEntre(antes.desde, antes.hasta);
      const dentro = () => sumarDias(antes.desde, azar(largo + 1));
      const actividades = Array.from({ length: azar(4) }, dentro);
      const alojamientos = Array.from({ length: azar(3) }, () => {
        const desde = dentro();
        return { desde, hasta: sumarDias(desde, azar(diasEntre(desde, antes.hasta) + 1)) };
      });

      // Modelo: corrimiento que se le aplica a cada cosa, o null si nada sirve.
      const corrimiento = diasEntre(antes.desde, despues.desde);
      const cabe = (c: number) =>
        actividades.every(
          (d) => despues.desde <= sumarDias(d, c) && sumarDias(d, c) <= despues.hasta,
        ) &&
        alojamientos.every(
          (a) => despues.desde <= sumarDias(a.desde, c) && sumarDias(a.hasta, c) <= despues.hasta,
        );
      const semanasPosible = corrimiento !== 0 && corrimiento % 7 === 0;
      const mismoLargo = diasEntre(despues.desde, despues.hasta) === largo;
      const orden = mismoLargo ? [corrimiento, 0] : [0, corrimiento];
      const esperado = orden.find((c) => (c === 0 || semanasPosible) && cabe(c));

      const elegido = elegirPlan(antes, despues, [...actividades.map(delDia), ...alojamientos]);
      if (esperado === undefined) {
        expect(elegido).toBeNull();
        continue;
      }
      expect(elegido!.semanas).toBe(esperado / 7);
      for (const dia of actividades) {
        const movido = moverDia(elegido!.plan, dia);
        expect(movido).toBe(sumarDias(dia, esperado));
        expect(diaDeLaSemana(movido!)).toBe(diaDeLaSemana(dia));
      }
      for (const estadia of alojamientos) {
        const movida = moverRango(elegido!.plan, estadia);
        expect(diasEntre(movida!.desde, movida!.hasta)).toBe(
          diasEntre(estadia.desde, estadia.hasta),
        );
      }
    }
  });
});

describe('CU27: datos del viaje que cambia el Admin', () => {
  const datos = {
    nombre: 'Sur',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
  };

  it('RN-V1: acepta nombre, destino y fechas, y deja afuera la moneda', () => {
    const r = esquemaDatosViaje.safeParse({ ...datos, monedaCodigo: 'USD' });
    expect(r.success).toBe(true);
    expect(r.data).toEqual(datos);
  });

  it('rechaza fechas invertidas, un viaje de más de un año y campos vacíos', () => {
    const invertidas = esquemaDatosViaje.safeParse({ ...datos, fechaFin: '2026-12-09' });
    expect(invertidas.error?.issues[0]).toMatchObject({ path: ['fechaFin'] });
    expect(esquemaDatosViaje.safeParse({ ...datos, fechaFin: '2027-12-11' }).success).toBe(false);
    expect(esquemaDatosViaje.safeParse({ ...datos, fechaFin: '2027-12-10' }).success).toBe(true);
    expect(esquemaDatosViaje.safeParse({ ...datos, nombre: '  ' }).success).toBe(false);
    expect(esquemaDatosViaje.safeParse({ ...datos, fechaInicio: '2026-02-30' }).success).toBe(
      false,
    );
  });
});
