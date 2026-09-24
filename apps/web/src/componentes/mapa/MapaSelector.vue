<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{ latitud: number | null; longitud: number | null }>();
const emit = defineEmits<{ elegir: [latitud: number, longitud: number] }>();

const contenedor = ref<HTMLElement | null>(null);
let mapa: L.Map | undefined;
let marcador: L.CircleMarker | undefined;

// Sin coordenadas, el mapa arranca mostrando la Argentina.
const CENTRO_INICIAL: L.LatLngTuple = [-38.4, -63.6];

function ubicarMarcador() {
  if (!mapa || props.latitud === null || props.longitud === null) return;
  const punto: L.LatLngTuple = [props.latitud, props.longitud];
  marcador ??= L.circleMarker(punto, { radius: 8, color: '#0969da', fillOpacity: 0.8 }).addTo(mapa);
  marcador.setLatLng(punto);
  mapa.setView(punto, Math.max(mapa.getZoom(), 13));
}

onMounted(() => {
  if (!contenedor.value) return;
  mapa = L.map(contenedor.value).setView(CENTRO_INICIAL, 4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; colaboradores de OpenStreetMap',
  }).addTo(mapa);
  // D8: marcar el punto con un clic sirve de alternativa si el buscador no encuentra el lugar.
  mapa.on('click', (e: L.LeafletMouseEvent) => emit('elegir', e.latlng.lat, e.latlng.lng));
  ubicarMarcador();
});

watch(() => [props.latitud, props.longitud], ubicarMarcador);
onBeforeUnmount(() => mapa?.remove());
</script>

<template>
  <div
    ref="contenedor"
    class="mapa"
    role="application"
    aria-label="Mapa: hacé clic para marcar la ubicación"
  ></div>
</template>

<style scoped>
.mapa {
  height: 16rem;
  border-radius: var(--radio);
  border: 1px solid var(--color-borde);
}
</style>
