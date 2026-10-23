<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ActividadDelItinerario, PuntoDelRecorrido } from '@viajes/compartido';

const props = defineProps<{
  actividades: ActividadDelItinerario[];
  recorrido: PuntoDelRecorrido[];
  elegidaId: string | null;
  /** Actividad abierta que no está confirmada: se muestra en gris, sin número ni recorrido. */
  fueraDelRecorrido?: ActividadDelItinerario | null;
}>();
const emit = defineEmits<{ elegir: [id: string] }>();

const contenedor = ref<HTMLElement | null>(null);
let mapa: L.Map | undefined;
let capas: L.LayerGroup | undefined;
const marcadores = new Map<string, L.Marker>();

// Sin actividades, el mapa muestra la Argentina.
const CENTRO_INICIAL: L.LatLngTuple = [-38.4, -63.6];
const TAMANO = 28;
// Distancia en píxeles entre marcadores que caen en el mismo lugar.
const SEPARACION = 24;

/**
 * Corrimiento horizontal de cada marcador: los que comparten coordenadas se reparten a los costados
 * del punto, en píxeles, para que se vean todos los números con cualquier zoom.
 */
function corrimientos(puntos: ActividadDelItinerario[]): number[] {
  const clave = (a: ActividadDelItinerario) => `${a.latitud},${a.longitud}`;
  const total = new Map<string, number>();
  for (const a of puntos) total.set(clave(a), (total.get(clave(a)) ?? 0) + 1);
  const vistos = new Map<string, number>();
  return puntos.map((a) => {
    const k = vistos.get(clave(a)) ?? 0;
    vistos.set(clave(a), k + 1);
    return (k - ((total.get(clave(a)) ?? 1) - 1) / 2) * SEPARACION;
  });
}

function icono(clase: string, texto: string, corrimiento: number) {
  return L.divIcon({
    className: clase,
    html: texto,
    iconSize: [TAMANO, TAMANO],
    iconAnchor: [TAMANO / 2 - corrimiento, TAMANO / 2],
  });
}

/**
 * RN-M5 y RN-M6: un marcador numerado por actividad, en orden, y la línea del recorrido. El
 * marcador es un ícono de texto para no depender de las imágenes de Leaflet, que Vite no empaqueta.
 */
function dibujar() {
  if (!mapa || !capas) return;
  capas.clearLayers();
  marcadores.clear();
  const fuera = props.fueraDelRecorrido ?? null;
  const desplazamientos = corrimientos(fuera ? [...props.actividades, fuera] : props.actividades);
  props.actividades.forEach((a, i) => {
    const marcador = L.marker([a.latitud, a.longitud], {
      icon: icono('marcador-actividad', `<span>${i + 1}</span>`, desplazamientos[i]!),
      title: a.titulo,
      alt: a.titulo,
    })
      .on('click', () => emit('elegir', a.id))
      // Leaflet deja enfocar el marcador con Tab, pero no lo abre con el teclado.
      .on('keydown', (e) => {
        const tecla = (e as L.LeafletKeyboardEvent).originalEvent;
        if (tecla.key !== 'Enter' && tecla.key !== ' ') return;
        tecla.preventDefault();
        emit('elegir', a.id);
      })
      .addTo(capas!);
    marcadores.set(a.id, marcador);
  });
  if (fuera) {
    const marcador = L.marker([fuera.latitud, fuera.longitud], {
      icon: icono(
        'marcador-actividad marcador-actividad--fuera',
        '',
        desplazamientos[props.actividades.length]!,
      ),
      title: `${fuera.titulo} (no confirmada)`,
      alt: `${fuera.titulo} (no confirmada)`,
      keyboard: false,
      interactive: false,
    }).addTo(capas);
    marcadores.set(fuera.id, marcador);
  }
  if (props.recorrido.length > 1) {
    L.polyline(
      props.recorrido.map((p) => [p.latitud, p.longitud] as L.LatLngTuple),
      { color: '#0f766e', weight: 3 },
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

watch(() => [props.actividades, props.recorrido, props.fueraDelRecorrido], dibujar);
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
  /* Las capas de Leaflet quedan dentro del mapa y no tapan la barra de navegación del celular. */
  isolation: isolate;
}
@media (min-width: 64rem) {
  .mapa-actividades {
    height: 34rem;
  }
}
/* El ícono lo crea Leaflet fuera del alcance del estilo del componente. */
:deep(.marcador-actividad) {
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-acento);
  color: var(--color-sobre-acento);
  font-weight: bold;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px var(--color-acento);
}
:deep(.marcador-actividad--fuera) {
  background: var(--color-texto-secundario);
  box-shadow: 0 0 0 1px var(--color-texto-secundario);
}
</style>
