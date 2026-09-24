import { describe, expect, it } from 'vitest';
import { Coordenadas } from '../../src/compartido/valores/coordenadas.js';
import { Intervalo } from '../../src/compartido/valores/intervalo.js';
import { Actividad } from '../../src/modulos/actividades/dominio/actividad.js';
import {
  DenegarOpcionesRestantes,
  SinSuperposicionConConfirmadas,
} from '../../src/modulos/actividades/dominio/politicas.js';
import { agendada } from '../contratos/politicas.contrato.js';

const AHORA = new Date('2026-09-24T12:00:00Z');
const datos = (titulo: string, horaInicio = '10:00', duracionMin = 120) => ({
  id: crypto.randomUUID(),
  viajeId: 'v1',
  autorId: 'ana',
  titulo,
  descripcion: 'x',
  ubicacion: 'Lago',
  coordenadas: Coordenadas.crear(-41.1, -71.4),
  fecha: '2026-12-11',
  horaInicio,
  duracionMin,
  ahora: AHORA,
});

describe('Actividad', () => {
  it('RN-A1: se propone pendiente, como propuesta de tipo actividad y sin votos', () => {
    const kayak = Actividad.proponer(datos('Kayak'));
    expect(kayak.propuesta.aDatos()).toMatchObject({
      tipo: 'ACTIVIDAD',
      estado: 'PENDIENTE',
      votos: [],
    });
    expect(kayak.detalle).toEqual({
      titulo: 'Kayak',
      fecha: '2026-12-11',
      horaInicio: '10:00',
      duracionMin: 120,
      alternativaDeId: null,
    });
    expect(kayak.grupo).toBe(kayak.id);
    expect(kayak.intervalo).toEqual(Intervalo.deActividad('2026-12-11', '10:00', 120));
  });

  it('rechaza horarios y duraciones inválidos', () => {
    expect(() => Actividad.proponer(datos('Kayak', '25:00'))).toThrow(
      expect.objectContaining({ codigo: 'HORA_INVALIDA' }),
    );
    expect(() => Actividad.proponer(datos('Kayak', '10:00', 0))).toThrow(
      expect.objectContaining({ codigo: 'DURACION_INVALIDA' }),
    );
  });

  it('RN-B1: la alternativa queda vinculada a la original y comparte su grupo', () => {
    const original = Actividad.proponer(datos('Kayak'));
    const trekking = original.crearAlternativa(datos('Trekking'));
    expect(trekking.detalle.alternativaDeId).toBe(original.id);
    expect(trekking.grupo).toBe(original.id);
    expect(trekking.propuesta.viajeId).toBe('v1');
  });

  it('RN-B3: la alternativa de una alternativa se vincula a la original, sin cadenas', () => {
    const original = Actividad.proponer(datos('Kayak'));
    const trekking = original.crearAlternativa(datos('Trekking'));
    const bici = trekking.crearAlternativa(datos('Bici'));
    expect(bici.detalle.alternativaDeId).toBe(original.id);
  });

  it('RN-B1: solo se proponen alternativas a actividades pendientes', () => {
    for (const accion of ['confirmar', 'denegar'] as const) {
      const original = Actividad.proponer(datos('Kayak'));
      original.propuesta.resolver(accion, 'ana', AHORA);
      expect(() => original.crearAlternativa(datos('Trekking'))).toThrow(
        expect.objectContaining({ categoria: 'CONFLICTO', codigo: 'ORIGINAL_NO_PENDIENTE' }),
      );
    }
  });
});

describe('SinSuperposicionConConfirmadas (RN-A2)', () => {
  const politica = new SinSuperposicionConConfirmadas();
  const candidata = (hora: string, duracion: number, fecha = '2026-12-11') => ({
    id: 'nueva',
    intervalo: Intervalo.deActividad(fecha, hora, duracion),
  });
  const kayak = agendada('kayak', '2026-12-11', '10:00', 120);
  const ids = (hora: string, duracion: number, fecha?: string) =>
    politica.conflictos(candidata(hora, duracion, fecha), [kayak]).map((c) => c.id);

  it('las actividades que se tocan en el borde no chocan', () => {
    expect(ids('12:00', 60)).toEqual([]);
    expect(ids('08:00', 120)).toEqual([]);
  });

  it('chocan si una contiene a la otra o se cruzan en parte', () => {
    expect(ids('10:30', 30)).toEqual(['kayak']);
    expect(ids('09:00', 240)).toEqual(['kayak']);
    expect(ids('11:30', 60)).toEqual(['kayak']);
  });

  it('una actividad que pasa la medianoche choca con la madrugada del día siguiente', () => {
    const salida = agendada('salida', '2026-12-11', '23:00', 180);
    expect(politica.conflictos(candidata('01:00', 60, '2026-12-12'), [salida])).toEqual([salida]);
    expect(politica.conflictos(candidata('02:00', 60, '2026-12-12'), [salida])).toEqual([]);
  });

  it('una actividad ya confirmada no choca consigo misma al reconfirmarse', () => {
    expect(politica.conflictos({ id: 'kayak', intervalo: kayak.intervalo }, [kayak])).toEqual([]);
  });
});

describe('DenegarOpcionesRestantes (RN-R4)', () => {
  it('deniega las demás opciones pendientes del grupo', () => {
    const original = Actividad.proponer(datos('Kayak'));
    const trekking = original.crearAlternativa(datos('Trekking'));
    const bici = original.crearAlternativa(datos('Bici'));
    const denegada = original.crearAlternativa(datos('Rafting'));
    denegada.propuesta.resolver('denegar', 'ana', AHORA);
    const aDenegar = new DenegarOpcionesRestantes().opcionesADenegar(trekking, [
      original,
      trekking,
      bici,
      denegada,
    ]);
    expect(aDenegar.map((a) => a.detalle.titulo)).toEqual(['Kayak', 'Bici']);
  });
});
