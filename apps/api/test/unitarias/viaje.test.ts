import { describe, expect, it } from 'vitest';
import { Viaje } from '../../src/modulos/viajes/dominio/viaje.js';

const AHORA = new Date('2026-09-24T12:00:00Z');
const [ANA, TOMAS, LUIS] = ['ana', 'tomas', 'luis'];

function viajeConParticipantes(...viajeros: string[]): Viaje {
  const v = Viaje.crear({
    id: 'v1',
    nombre: 'Bariloche',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    monedaCodigo: 'ARS',
    creadorId: ANA,
    ahora: AHORA,
  });
  for (const u of viajeros) v.agregarViajero(ANA, u, AHORA);
  return v;
}

describe('Viaje', () => {
  it('RN-T1: quien crea el viaje queda como su único Admin', () => {
    const v = viajeConParticipantes();
    expect(v.esAdmin(ANA)).toBe(true);
    expect(v.participantesActivos()).toHaveLength(1);
  });

  it('CU01: rechaza un rango de fechas invertido', () => {
    expect(() =>
      Viaje.crear({
        id: 'x',
        nombre: 'n',
        destino: 'd',
        fechaInicio: '2026-12-16',
        fechaFin: '2026-12-10',
        monedaCodigo: 'ARS',
        creadorId: ANA,
        ahora: AHORA,
      }),
    ).toThrow(expect.objectContaining({ codigo: 'RANGO_FECHAS_INVALIDO' }));
  });

  describe('CU02: agregar viajero', () => {
    it('solo el Admin agrega, y no dos veces a la misma persona', () => {
      const v = viajeConParticipantes(TOMAS);
      expect(() => v.agregarViajero(TOMAS, LUIS, AHORA)).toThrow(
        expect.objectContaining({ codigo: 'SOLO_ADMIN' }),
      );
      expect(() => v.agregarViajero(ANA, TOMAS, AHORA)).toThrow(
        expect.objectContaining({ codigo: 'YA_ES_PARTICIPANTE' }),
      );
    });

    it('RN-E8: volver a agregar a alguien que se fue reactiva su misma membresía', () => {
      const v = viajeConParticipantes(TOMAS);
      v.eliminarParticipante(ANA, TOMAS, true, AHORA);
      v.agregarViajero(ANA, TOMAS, AHORA);
      const m = v.membresiaDe(TOMAS)!.aDatos();
      expect(m).toMatchObject({
        estado: 'ACTIVA',
        rol: 'VIAJERO',
        bajaEn: null,
        bajaConDeuda: false,
      });
      expect(m.altaEn).toEqual(AHORA);
      expect(v.aDatos().membresias).toHaveLength(2);
    });
  });

  describe('CU03: eliminar participante', () => {
    it('RN-E1: solo el Admin elimina', () => {
      const v = viajeConParticipantes(TOMAS, LUIS);
      expect(() => v.eliminarParticipante(TOMAS, LUIS, false, AHORA)).toThrow(
        expect.objectContaining({ codigo: 'SOLO_ADMIN' }),
      );
    });

    it('RN-E2: el Admin no se elimina a sí mismo y no elimina a quien no participa', () => {
      const v = viajeConParticipantes(TOMAS);
      expect(() => v.eliminarParticipante(ANA, ANA, false, AHORA)).toThrow(
        expect.objectContaining({ codigo: 'NO_PUEDE_ELIMINARSE_A_SI_MISMO' }),
      );
      expect(() => v.eliminarParticipante(ANA, LUIS, false, AHORA)).toThrow(
        expect.objectContaining({ codigo: 'NO_ENCONTRADO' }),
      );
    });

    it('RN-E3 y RN-E4: baja lógica que conserva la membresía y registra si había deuda', () => {
      const v = viajeConParticipantes(TOMAS, LUIS);
      v.eliminarParticipante(ANA, TOMAS, true, AHORA);
      v.eliminarParticipante(ANA, LUIS, false, AHORA);
      expect(v.membresiaDe(TOMAS)!.aDatos()).toMatchObject({
        estado: 'ELIMINADA',
        bajaConDeuda: true,
        bajaEn: AHORA,
      });
      expect(v.membresiaDe(LUIS)!.aDatos()).toMatchObject({
        estado: 'ELIMINADA',
        bajaConDeuda: false,
      });
      expect(v.esParticipanteActivo(TOMAS)).toBe(false);
      expect(v.extraerEventos()).toEqual([
        expect.objectContaining({
          tipo: 'viaje.miembro-dado-de-baja',
          usuarioId: TOMAS,
          motivo: 'ELIMINADO',
          bajaConDeuda: true,
        }),
        expect.objectContaining({
          tipo: 'viaje.miembro-dado-de-baja',
          usuarioId: LUIS,
          bajaConDeuda: false,
        }),
      ]);
      expect(v.extraerEventos()).toEqual([]);
    });
  });

  describe('CU24: transferir la administración', () => {
    it('RN-T2: el elegido pasa a Admin y el anterior a viajero', () => {
      const v = viajeConParticipantes(TOMAS);
      v.transferirAdministracion(ANA, TOMAS);
      expect(v.esAdmin(TOMAS)).toBe(true);
      expect(v.esAdmin(ANA)).toBe(false);
      expect(v.esParticipanteActivo(ANA)).toBe(true);
      expect(v.extraerEventos()).toEqual([
        {
          tipo: 'viaje.administracion-transferida',
          viajeId: 'v1',
          anteriorAdminId: ANA,
          nuevoAdminId: TOMAS,
        },
      ]);
    });

    it('el sucesor tiene que ser otro participante activo y solo transfiere el Admin', () => {
      const v = viajeConParticipantes(TOMAS);
      expect(() => v.transferirAdministracion(ANA, ANA)).toThrow(
        expect.objectContaining({ codigo: 'SUCESOR_INVALIDO' }),
      );
      expect(() => v.transferirAdministracion(ANA, LUIS)).toThrow(
        expect.objectContaining({ codigo: 'SUCESOR_INVALIDO' }),
      );
      expect(() => v.transferirAdministracion(TOMAS, ANA)).toThrow(
        expect.objectContaining({ codigo: 'SOLO_ADMIN' }),
      );
    });
  });

  describe('CU04: salir del grupo', () => {
    it('RN-E7: un viajero sale aunque tenga deuda, y queda registrado', () => {
      const v = viajeConParticipantes(TOMAS);
      v.salir(TOMAS, undefined, true, AHORA);
      expect(v.membresiaDe(TOMAS)!.aDatos()).toMatchObject({
        estado: 'RETIRADA',
        bajaConDeuda: true,
      });
      expect(v.extraerEventos()).toEqual([
        expect.objectContaining({ motivo: 'RETIRADO', usuarioId: TOMAS }),
      ]);
    });

    it('RN-T3: el Admin tiene que elegir sucesor, y el traspaso y la salida van juntos', () => {
      const v = viajeConParticipantes(TOMAS);
      expect(() => v.salir(ANA, undefined, false, AHORA)).toThrow(
        expect.objectContaining({ codigo: 'FALTA_SUCESOR' }),
      );
      v.salir(ANA, TOMAS, false, AHORA);
      expect(v.esAdmin(TOMAS)).toBe(true);
      expect(v.membresiaDe(ANA)!.aDatos()).toMatchObject({ estado: 'RETIRADA', rol: 'VIAJERO' });
      expect(v.participantesActivos().filter((m) => m.esAdminActivo())).toHaveLength(1);
    });

    it('RN-T4: el Admin que es el único participante no puede salir', () => {
      const v = viajeConParticipantes();
      expect(() => v.salir(ANA, undefined, false, AHORA)).toThrow(
        expect.objectContaining({ codigo: 'ADMIN_UNICO_PARTICIPANTE' }),
      );
    });

    it('no puede salir quien ya no participa', () => {
      const v = viajeConParticipantes(TOMAS);
      v.salir(TOMAS, undefined, false, AHORA);
      expect(() => v.salir(TOMAS, undefined, false, AHORA)).toThrow(
        expect.objectContaining({ codigo: 'NO_ENCONTRADO' }),
      );
    });
  });

  it('se reconstruye igual a partir de sus datos', () => {
    const v = viajeConParticipantes(TOMAS);
    expect(Viaje.reconstruir(v.aDatos()).aDatos()).toEqual(v.aDatos());
  });
});

describe('Viaje.diaInicialDelMapa (RN-M1, P19)', () => {
  const v = viajeConParticipantes(); // del 2026-12-10 al 2026-12-16

  it('hoy dentro del viaje: muestra hoy, tenga o no actividades', () => {
    expect(v.diaInicialDelMapa('2026-12-12', ['2026-12-12', '2026-12-14'])).toBe('2026-12-12');
    expect(v.diaInicialDelMapa('2026-12-13', ['2026-12-12', '2026-12-14'])).toBe('2026-12-13');
    expect(v.diaInicialDelMapa('2026-12-16', [])).toBe('2026-12-16');
  });

  it('hoy antes o después del viaje: el primer día con actividades confirmadas', () => {
    expect(v.diaInicialDelMapa('2026-09-24', ['2026-12-14', '2026-12-12'])).toBe('2026-12-12');
    expect(v.diaInicialDelMapa('2027-01-05', ['2026-12-15', '2026-12-11'])).toBe('2026-12-11');
  });

  it('sin actividades confirmadas: el primer día del viaje', () => {
    expect(v.diaInicialDelMapa('2026-09-24', [])).toBe('2026-12-10');
    expect(v.diaInicialDelMapa('2027-01-05', [])).toBe('2026-12-10');
  });
});
