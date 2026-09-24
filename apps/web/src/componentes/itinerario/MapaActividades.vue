<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ActividadDelItinerario, PuntoDelRecorrido } from '@viajes/compartido';

const props = defineProps<{
  actividades: ActividadDelItinerario[];
  recorrido: PuntoDelRecorrido[];
  elegidaId: string | null;
}>();
const emit = defineEmits<{ elegir: [id: string] }>();

const contenedor = ref<HTMLElement | null>(null);
let mapa: L.Map | undefined;
let capas: L.LayerGroup | undefined;
const marcadores = new Map<string, L.Marker>();

// Sin actividades, el mapa muestra la Argentina.
const CENTRO_INICIAL: L.LatLngTuple = [-38.4, -63.6];

/**
 * RN-M5 y RN-M6: un marcador numerado por actividad, en orden, y la línea del recorrido. El
 * marcador es un ícono de texto para no depender de las imágenes de Leaflet, que Vite no empaqueta.
 */
function dibujar() {
  if (!mapa || !capas) return;
  capas.clearLayers();
  marcadores.clear();
  props.actividades.forEach((a, i) => {
    const icono = L.divIcon({
      className: 'marcador-actividad',
      html: `<span>${i + 1}</span>`,
      iconSize: [28, 28],
    });
    const marcador = L.marker([a.latitud, a.longitud], {
      icon: icono,
      title: a.titulo,
      alt: a.titulo,
    })
      .on('click', () => emit('elegir', a.id))
      .addTo(capas!);
    marcadores.set(a.id, marcador);
  });
  if (props.recorrido.length > 1) {
    L.polyline(
      props.recorrido.map((p) => [p.latitud, p.longitud] as L.LatLngTuple),
      { color: '#0969da', weight: 3 },
    ).addTo(capas);
  }
  const puntos = props.actividades.map((a) => [a.latitud, a.longitud] as L.LatLngTuple);
  if (puntos.length === 1) mapa.setView(puntos[0]!, 14);
  else if (puntos.length > 1) mapa.fitBounds(L.latLngBounds(puntos), { padding: [32, 32] });
  centrarEnElegida();
}

/** RN-M8: centra el mapa en la actividad elegida. */
function centrarEnElegida() {
  const marcador = props.elegidaId ? marcadores.get(props.elegidaId) : undefined;
  if (mapa && marcador) mapa.setView(marcador.getLatLng(), Math.max(mapa.getZoom(), 15));
}

onMounted(() => {
  if (!contenedor.value) return;
  mapa = L.map(contenedor.value).setView(CENTRO_INICIAL, 4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; colaboradores de OpenStreetMap',
  }).addTo(mapa);
  capas = L.layerGroup().addTo(mapa);
  dibujar();
});

watch(() => [props.actividades, props.recorrido], dibujar);
watch(() => props.elegidaId, centrarEnElegida);
onBeforeUnmount(() => mapa?.remove());
</script>

<template>
  <div
    ref="contenedor"
    class="mapa-actividades"
    role="application"
    aria-label="Mapa de las actividades del día"
  ></div>
</template>

<style scoped>
.mapa-actividades {
  height: 26rem;
  border-radius: var(--radio);
  border: 1px solid var(--color-borde);
}
/* El ícono lo crea Leaflet fuera del alcance del estilo del componente. */
:deep(.marcador-actividad) {
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-acento);
  color: #fff;
  font-weight: bold;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px var(--color-acento);
}
</style>
