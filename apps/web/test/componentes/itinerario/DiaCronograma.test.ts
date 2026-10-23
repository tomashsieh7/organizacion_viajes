import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { ActividadDelItinerario, DiaDelCronograma } from '@viajes/compartido';
import DiaCronograma from '../../../src/componentes/itinerario/DiaCronograma.vue';

const actividad = (
  titulo: string,
  horaInicio: string,
  horaFin: string,
  duracionMin: number,
): ActividadDelItinerario => ({
  id: titulo,
  titulo,
  descripcion: '',
  fecha: '2026-12-11',
  horaInicio,
  horaFin,
  duracionMin,
  ubicacion: 'Centro',
  latitud: -41,
  longitud: -71,
});

const montar = (dia: Partial<DiaDelCronograma>) =>
  mount(DiaCronograma, {
    props: {
      dia: {
        fecha: '2026-12-11',
        siguenDelDiaAnterior: [],
        actividades: [],
        alojamientos: [],
        ...dia,
      },
      viajeId: 'v1',
      esHoy: false,
    },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  });

describe('DiaCronograma (RN-C2)', () => {
  it('aclara cuando una actividad termina al día siguiente, y no cuando termina a las 00:00', () => {
    const v = montar({
      actividades: [
        actividad('Noche', '22:00', '01:00', 180),
        actividad('Cena', '23:00', '00:00', 60),
      ],
    });
    const horarios = v.findAll('li:not(.sigue) .agenda__hora').map((h) => h.text());
    expect(horarios).toEqual(['22:00 a 01:00 del día siguiente', '23:00 a 00:00']);
  });

  it('muestra primero lo que sigue del día anterior, y entonces el día no queda vacío', () => {
    const v = montar({
      siguenDelDiaAnterior: [{ id: 'n', titulo: 'Noche', ubicacion: 'Centro', horaFin: '01:00' }],
    });
    expect(v.text()).not.toContain('Sin actividades confirmadas');
    expect(v.find('li').text()).toContain('Hasta 01:00');
    expect(v.find('li').text()).toContain('Noche');
    expect(v.find('li').text()).toContain('sigue del día anterior');
  });

  it('numera solo las actividades del día, como los marcadores del mapa, aunque algo siga del anterior', () => {
    const v = montar({
      siguenDelDiaAnterior: [{ id: 'n', titulo: 'Noche', ubicacion: 'Centro', horaFin: '01:00' }],
      actividades: [
        actividad('Kayak', '10:00', '12:00', 120),
        actividad('Cena', '21:00', '22:00', 60),
      ],
    });
    expect(v.findAll('.agenda__numero').map((n) => n.text())).toEqual(['', '1', '2']);
  });

  it('sin actividades propias ni que sigan, lo dice', () => {
    expect(montar({}).text()).toContain('Sin actividades confirmadas');
  });
});
