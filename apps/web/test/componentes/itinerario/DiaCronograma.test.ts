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
    const horarios = v.findAll('.horario').map((h) => h.text());
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

  it('sin actividades propias ni que sigan, lo dice', () => {
    expect(montar({}).text()).toContain('Sin actividades confirmadas');
  });
});
