import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MapaActividades from '../../../src/componentes/itinerario/MapaActividades.vue';
import type { ActividadDelItinerario } from '@viajes/compartido';

// Leaflet se reemplaza por un doble que registra lo que se dibuja.
const dibujado = vi.hoisted(() => ({
  marcadores: [] as {
    punto: [number, number];
    html: string;
    titulo: string;
    clase: string;
    ancla: [number, number];
  }[],
  polilineas: [] as [number, number][][],
  clicks: new Map<string, () => void>(),
  teclas: new Map<string, (e: unknown) => void>(),
  centro: null as unknown,
}));
vi.mock('leaflet', () => {
  const capa = () => ({ addTo: () => capa(), clearLayers: () => undefined });
  const mapa = {
    setView: (punto: unknown) => ((dibujado.centro = punto), mapa),
    fitBounds: () => mapa,
    getZoom: () => 10,
    remove: () => undefined,
  };
  return {
    default: {
      map: () => mapa,
      tileLayer: () => ({ addTo: () => undefined }),
      layerGroup: () => ({ addTo: () => capa(), clearLayers: () => undefined }),
      divIcon: (o: { html: string }) => o,
      latLngBounds: (p: unknown) => p,
      marker: (
        punto: [number, number],
        o: {
          icon: { html: string; className: string; iconAnchor: [number, number] };
          title: string;
        },
      ) => {
        dibujado.marcadores.push({
          punto,
          html: o.icon.html,
          titulo: o.title,
          clase: o.icon.className,
          ancla: o.icon.iconAnchor,
        });
        const m = {
          on: (evento: string, f: (e: unknown) => void) => (
            (evento === 'click' ? dibujado.clicks : dibujado.teclas).set(o.title, f),
            m
          ),
          addTo: () => m,
          getLatLng: () => punto,
        };
        return m;
      },
      polyline: (puntos: [number, number][]) => {
        dibujado.polilineas.push(puntos);
        return { addTo: () => undefined };
      },
    },
  };
});

const actividad = (id: string, titulo: string, latitud: number, longitud: number) =>
  ({ id, titulo, latitud, longitud }) as ActividadDelItinerario;

beforeEach(() => {
  dibujado.marcadores = [];
  dibujado.polilineas = [];
  dibujado.clicks.clear();
  dibujado.teclas.clear();
  dibujado.centro = null;
});

describe('MapaActividades', () => {
  it('RN-M5 y RN-M6: un marcador numerado por actividad y una polilínea en orden', async () => {
    const actividades = [
      actividad('a', 'Kayak', -41.1, -71.5),
      actividad('b', 'Almuerzo', -41.2, -71.4),
      actividad('c', 'Cena', -41.3, -71.3),
    ];
    const vista = mount(MapaActividades, {
      props: {
        actividades,
        recorrido: actividades.map(({ latitud, longitud }) => ({ latitud, longitud })),
        elegidaId: null,
      },
    });
    expect(dibujado.marcadores.map((m) => [m.titulo, m.html, m.punto])).toEqual([
      ['Kayak', '<span>1</span>', [-41.1, -71.5]],
      ['Almuerzo', '<span>2</span>', [-41.2, -71.4]],
      ['Cena', '<span>3</span>', [-41.3, -71.3]],
    ]);
    expect(dibujado.polilineas).toEqual([
      [
        [-41.1, -71.5],
        [-41.2, -71.4],
        [-41.3, -71.3],
      ],
    ]);
    dibujado.clicks.get('Almuerzo')!();
    expect(vista.emitted('elegir')).toEqual([['b']]);
  });

  it('separa los marcadores que caen en el mismo lugar para que se vean todos los números', () => {
    const actividades = [
      actividad('a', 'Desayuno', -41.1, -71.5),
      actividad('b', 'Kayak', -41.2, -71.4),
      actividad('c', 'Cena', -41.1, -71.5),
    ];
    mount(MapaActividades, { props: { actividades, recorrido: [], elegidaId: null } });
    expect(dibujado.marcadores.map((m) => [m.titulo, m.ancla])).toEqual([
      ['Desayuno', [26, 14]],
      ['Kayak', [14, 14]],
      ['Cena', [2, 14]],
    ]);
  });

  it('con el teclado, Enter y Espacio sobre un marcador abren su detalle', () => {
    const vista = mount(MapaActividades, {
      props: { actividades: [actividad('a', 'Kayak', -41, -71)], recorrido: [], elegidaId: null },
    });
    const tecla = (key: string) => {
      const originalEvent = { key, preventDefault: vi.fn() };
      dibujado.teclas.get('Kayak')!({ originalEvent });
      return originalEvent.preventDefault;
    };
    expect(tecla('Tab')).not.toHaveBeenCalled();
    expect(tecla('Enter')).toHaveBeenCalled();
    expect(tecla(' ')).toHaveBeenCalled();
    expect(vista.emitted('elegir')).toEqual([['a'], ['a']]);
  });

  it('RN-M8: la actividad no confirmada va en gris, sin número, y el mapa se centra en ella', () => {
    const pendiente = actividad('p', 'Pendiente', -42.5, -72.5);
    mount(MapaActividades, {
      props: {
        actividades: [actividad('a', 'Kayak', -41, -71)],
        recorrido: [],
        elegidaId: 'p',
        fueraDelRecorrido: pendiente,
      },
    });
    expect(dibujado.marcadores.map((m) => [m.titulo, m.html, m.clase])).toEqual([
      ['Kayak', '<span>1</span>', 'marcador-actividad'],
      ['Pendiente (no confirmada)', '', 'marcador-actividad marcador-actividad--fuera'],
    ]);
    expect(dibujado.centro).toEqual([-42.5, -72.5]);
  });
});
