import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MapaSelector from '../src/componentes/mapa/MapaSelector.vue';

// Leaflet se reemplaza por un doble que registra el marcador y permite simular un clic.
const leaflet = vi.hoisted(() => ({
  clic: undefined as ((e: { latlng: { lat: number; lng: number } }) => void) | undefined,
  marcadores: [] as [number, number][],
  vistas: [] as { punto: [number, number]; zoom: number }[],
  removido: false,
}));
vi.mock('leaflet', () => {
  const mapa = {
    setView: (punto: [number, number], zoom: number) => (
      leaflet.vistas.push({ punto, zoom }),
      mapa
    ),
    getZoom: () => 4,
    on: (_: string, f: typeof leaflet.clic) => ((leaflet.clic = f), mapa),
    remove: () => void (leaflet.removido = true),
  };
  return {
    default: {
      map: () => mapa,
      tileLayer: () => ({ addTo: () => undefined }),
      circleMarker: (punto: [number, number]) => {
        const marcador = {
          addTo: () => marcador,
          setLatLng: (p: [number, number]) => void leaflet.marcadores.push(p),
        };
        leaflet.marcadores.push(punto);
        return marcador;
      },
    },
  };
});

beforeEach(() => {
  leaflet.clic = undefined;
  leaflet.marcadores = [];
  leaflet.vistas = [];
  leaflet.removido = false;
});

describe('MapaSelector', () => {
  it('sin coordenadas muestra la Argentina y avisa el punto donde se hace clic', () => {
    const mapa = mount(MapaSelector, { props: { latitud: null, longitud: null } });
    expect(leaflet.vistas).toEqual([{ punto: [-38.4, -63.6], zoom: 4 }]);
    expect(leaflet.marcadores).toEqual([]);
    leaflet.clic!({ latlng: { lat: -41.1, lng: -71.3 } });
    expect(mapa.emitted('elegir')).toEqual([[-41.1, -71.3]]);
  });

  it('con coordenadas pone el marcador y lo mueve cuando cambian', async () => {
    const mapa = mount(MapaSelector, { props: { latitud: -41.13, longitud: -71.31 } });
    expect(leaflet.marcadores.at(-1)).toEqual([-41.13, -71.31]);
    expect(leaflet.vistas.at(-1)).toEqual({ punto: [-41.13, -71.31], zoom: 13 });
    await mapa.setProps({ latitud: -41.17, longitud: -71.44 });
    expect(leaflet.marcadores.at(-1)).toEqual([-41.17, -71.44]);
    mapa.unmount();
    expect(leaflet.removido).toBe(true);
  });
});
