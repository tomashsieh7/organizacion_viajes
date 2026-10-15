<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import IconoLinea from '../base/IconoLinea.vue';
import { nombreDelDia } from '../../utiles/fechas';

/**
 * RN-M7 y RN-C4: calendario del mes para elegir un día del viaje, compartido por el cronograma y
 * el mapa. Solo se pueden elegir los días del viaje; un punto marca los que tienen actividades
 * confirmadas. Con el teclado, las flechas mueven el foco entre días (una semana con arriba y
 * abajo) y Enter o Espacio eligen.
 */
const props = defineProps<{
  inicio: string;
  fin: string;
  seleccionado: string | null;
  diasConActividad: string[];
  hoy: string;
}>();
const emit = defineEmits<{ elegir: [dia: string] }>();

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const SEMANA = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['M', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
] as const;

const dos = (n: number) => String(n).padStart(2, '0');
const mesDe = (fecha: string) => fecha.slice(0, 7);
/** Suma días a una fecha `YYYY-MM-DD`, sin depender de la zona horaria. */
function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
function sumarMeses(mes: string, n: number): string {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${dos((total % 12) + 1)}`;
}

const mes = ref(mesDe(props.seleccionado ?? props.inicio));
watch(
  () => props.seleccionado,
  (dia) => {
    if (dia) mes.value = mesDe(dia);
  },
);

const titulo = computed(() => {
  const [a, m] = mes.value.split('-').map(Number) as [number, number];
  return `${MESES[m - 1]} ${a}`;
});
const hayAnterior = computed(() => mes.value > mesDe(props.inicio));
const haySiguiente = computed(() => mes.value < mesDe(props.fin));

interface Celda {
  fecha: string;
  numero: number;
  enViaje: boolean;
}
/** Las semanas del mes visible, de lunes a domingo; `null` completa la primera semana. */
const celdas = computed<(Celda | null)[]>(() => {
  const primero = `${mes.value}-01`;
  // getUTCDay: 0 es domingo; la semana empieza el lunes.
  const corrimiento = (new Date(`${primero}T00:00:00Z`).getUTCDay() + 6) % 7;
  const lista: (Celda | null)[] = Array.from({ length: corrimiento }, () => null);
  for (let fecha = primero; mesDe(fecha) === mes.value; fecha = sumarDias(fecha, 1)) {
    lista.push({
      fecha,
      numero: Number(fecha.slice(8)),
      enViaje: fecha >= props.inicio && fecha <= props.fin,
    });
  }
  return lista;
});

const conActividad = computed(() => new Set(props.diasConActividad));
/** El día que recibe el foco con Tab: el elegido, o el primero del viaje en este mes. */
const enfocable = computed(() => {
  if (props.seleccionado && mesDe(props.seleccionado) === mes.value) return props.seleccionado;
  return celdas.value.find((c) => c?.enViaje)?.fecha ?? null;
});

function etiqueta(c: Celda) {
  const partes = [nombreDelDia(c.fecha)];
  if (c.fecha === props.hoy) partes.push('hoy');
  if (conActividad.value.has(c.fecha)) partes.push('con actividades');
  return partes.join(', ');
}

const grilla = ref<HTMLElement | null>(null);
const DESPLAZAMIENTOS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};
async function mover(evento: KeyboardEvent, desde: string) {
  const paso = DESPLAZAMIENTOS[evento.key];
  if (paso === undefined) return;
  evento.preventDefault();
  const destino = sumarDias(desde, paso);
  if (destino < props.inicio || destino > props.fin) return;
  mes.value = mesDe(destino);
  await nextTick();
  grilla.value?.querySelector<HTMLElement>(`[data-fecha="${destino}"]`)?.focus();
}
</script>

<template>
  <div class="calendario">
    <div class="calendario__encabezado">
      <button
        v-if="hayAnterior || haySiguiente"
        type="button"
        class="boton boton--chico calendario__flecha"
        :disabled="!hayAnterior"
        aria-label="Mes anterior"
        @click="mes = sumarMeses(mes, -1)"
      >
        <IconoLinea nombre="flecha-izquierda" :tamano="18" />
      </button>
      <h3 class="calendario__mes" aria-live="polite">{{ titulo }}</h3>
      <button
        v-if="hayAnterior || haySiguiente"
        type="button"
        class="boton boton--chico calendario__flecha"
        :disabled="!haySiguiente"
        aria-label="Mes siguiente"
        @click="mes = sumarMeses(mes, 1)"
      >
        <IconoLinea nombre="flecha-derecha" :tamano="18" />
      </button>
    </div>
    <div class="calendario__semana" aria-hidden="true">
      <abbr v-for="([corto, largo], i) in SEMANA" :key="i" :title="largo">{{ corto }}</abbr>
    </div>
    <div ref="grilla" class="calendario__dias" role="group" :aria-label="`Días de ${titulo}`">
      <template v-for="(c, i) in celdas" :key="c?.fecha ?? `vacio-${i}`">
        <span v-if="!c" aria-hidden="true" />
        <span
          v-else-if="!c.enViaje"
          class="calendario__dia calendario__dia--fuera"
          aria-hidden="true"
          >{{ c.numero }}</span
        >
        <button
          v-else
          type="button"
          class="calendario__dia"
          :class="{
            'calendario__dia--hoy': c.fecha === hoy,
            'calendario__dia--con-actividad': conActividad.has(c.fecha),
          }"
          :data-fecha="c.fecha"
          :aria-pressed="c.fecha === seleccionado"
          :aria-label="etiqueta(c)"
          :tabindex="c.fecha === enfocable ? 0 : -1"
          @click="emit('elegir', c.fecha)"
          @keydown="mover($event, c.fecha)"
        >
          {{ c.numero }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.calendario {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  padding: var(--esp-3);
  margin-bottom: var(--esp-4);
  max-width: 26rem;
}
.calendario__encabezado {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  margin-bottom: var(--esp-2);
}
.calendario__mes {
  flex: 1;
  margin: 0;
  font-size: 1rem;
  text-align: center;
  text-transform: capitalize;
}
.calendario__flecha {
  width: 2.25rem;
  padding: 0;
}
.calendario__semana,
.calendario__dias {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
}
.calendario__semana abbr {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-texto-secundario);
  text-decoration: none;
  padding-bottom: var(--esp-1);
}
.calendario__dia {
  position: relative;
  display: grid;
  place-content: center;
  aspect-ratio: 1;
  min-height: 2.5rem;
  font: inherit;
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: 999px;
  background: none;
  color: var(--color-texto);
}
button.calendario__dia {
  cursor: pointer;
  background: var(--color-superficie-alt);
}
button.calendario__dia:hover {
  border-color: var(--color-borde-fuerte);
}
/* Los días fuera del viaje se distinguen por el peso y la falta de fondo, no por un gris ilegible. */
.calendario__dia--fuera {
  font-weight: 400;
  color: var(--color-texto-secundario);
}
.calendario__dia--hoy {
  border-color: var(--color-acento);
}
/* El punto de "con actividades" va debajo del número; el texto lo dice para lectores. */
.calendario__dia--con-actividad::after {
  content: '';
  position: absolute;
  bottom: 0.3rem;
  left: 50%;
  width: 0.3rem;
  height: 0.3rem;
  margin-left: -0.15rem;
  border-radius: 999px;
  background: var(--color-acento);
}
.calendario__dia[aria-pressed='true'] {
  background: var(--color-acento);
  border-color: var(--color-acento);
  color: var(--color-sobre-acento);
}
.calendario__dia[aria-pressed='true']::after {
  background: var(--color-sobre-acento);
}
</style>
