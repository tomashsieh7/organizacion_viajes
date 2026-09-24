import { describe, expect, it } from 'vitest';
import { Coordenadas } from '../../src/compartido/valores/coordenadas.js';
import { Intervalo } from '../../src/compartido/valores/intervalo.js';
import { Actividad } from '../../src/modulos/actividades/dominio/actividad.js';
import type {
  ActividadAgendada,
  PoliticaResolucionOpciones,
  PoliticaSuperposicion,
} from '../../src/modulos/actividades/dominio/politicas.js';

/**
 * Contratos de las políticas de actividades. Cualquier implementación futura (por ejemplo, la de
 * subgrupos del Release 3) tiene que cumplirlos para reemplazar a la del MVP sin romper los casos
 * de uso (Liskov).
 */
export function agendada(
  id: string,
  fecha: string,
  horaInicio: string,
  duracionMin: number,
): ActividadAgendada {
  return {
    id,
    titulo: id,
    fecha,
    horaInicio,
    duracionMin,
    intervalo: Intervalo.deActividad(fecha, horaInicio, duracionMin),
  };
}

export function probarContratoPoliticaSuperposicion(
  nombre: string,
  crear: () => PoliticaSuperposicion,
) {
  describe(`PoliticaSuperposicion — ${nombre}`, () => {
    const candidata = { id: 'c', intervalo: Intervalo.deActividad('2026-12-11', '10:00', 120) };

    it('sin actividades confirmadas no hay conflictos', () => {
      expect(crear().conflictos(candidata, [])).toEqual([]);
    });

    it('devuelve un subconjunto de las confirmadas y nunca a la propia candidata', () => {
      const confirmadas = [
        agendada('c', '2026-12-11', '10:00', 120),
        agendada('a', '2026-12-11', '11:00', 60),
        agendada('b', '2026-12-12', '10:00', 60),
      ];
      const conflictos = crear().conflictos(candidata, confirmadas);
      for (const c of conflictos) expect(confirmadas).toContain(c);
      expect(conflictos.map((c) => c.id)).not.toContain('c');
    });

    it('nunca marca como conflicto a una actividad que no se superpone', () => {
      const contiguas = [
        agendada('antes', '2026-12-11', '08:00', 120),
        agendada('despues', '2026-12-11', '12:00', 60),
      ];
      expect(crear().conflictos(candidata, contiguas)).toEqual([]);
    });
  });
}

let segundos = 0;
function opcion(original?: Actividad): Actividad {
  const datos = {
    id: crypto.randomUUID(),
    viajeId: 'v1',
    autorId: 'ana',
    titulo: 'Opción',
    descripcion: 'x',
    ubicacion: 'y',
    coordenadas: Coordenadas.crear(-41, -71),
    fecha: '2026-12-11',
    horaInicio: '10:00',
    duracionMin: 60,
    ahora: new Date(Date.UTC(2026, 8, 24, 12, 0, segundos++)),
  };
  return original ? original.crearAlternativa(datos) : Actividad.proponer(datos);
}

export function probarContratoPoliticaResolucionOpciones(
  nombre: string,
  crear: () => PoliticaResolucionOpciones,
) {
  describe(`PoliticaResolucionOpciones — ${nombre}`, () => {
    it('devuelve opciones pendientes del grupo, sin incluir a la confirmada', () => {
      const original = opcion();
      const alternativas = [opcion(original), opcion(original)];
      const resuelta = opcion(original);
      resuelta.propuesta.resolver('denegar', 'ana', new Date());
      const opciones = [original, ...alternativas, resuelta];

      const aDenegar = crear().opcionesADenegar(alternativas[0]!, opciones);
      for (const o of aDenegar) {
        expect(opciones).toContain(o);
        expect(o.propuesta.estado).toBe('PENDIENTE');
      }
      expect(aDenegar).not.toContain(alternativas[0]);
    });

    it('con una sola opción no deniega nada', () => {
      const original = opcion();
      expect(crear().opcionesADenegar(original, [original])).toEqual([]);
    });
  });
}
