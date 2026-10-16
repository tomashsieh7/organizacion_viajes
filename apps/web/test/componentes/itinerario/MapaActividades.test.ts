import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MapaActividades from '../src/componentes/itinerario/MapaActividades.vue';
import type { ActividadDelItinerario } from '@viajes/compartido';

// Leaflet se reemplaza por un doble que registra lo que se dibuja.
const dibujado = vi.hoisted(() => ({
  marcadores: [] as { punto: [number, number]; html: string; titulo: string }[],
  polilineas: [] as [number, number][][],
  clicks: new Map<string, () => void>(),
}));
vi.mock('leaflet', () => {
  const capa = () => ({ addTo: () => capa(), clearLayers: () => undefined });
  const mapa = {
    setView: () => mapa,
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
      marker: (punto: [number, number], o: { icon: { html: string }; title: string }) => {
        dibujado.marcadores.push({ punto, html: o.icon.html, titulo: o.title });
        const m = {
          on: (_: string, f: () => void) => (dibujado.clicks.set(o.title, f), m),
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
});
