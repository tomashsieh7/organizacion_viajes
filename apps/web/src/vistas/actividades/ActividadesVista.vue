<script setup lang="ts">
import IconoLinea from '../../componentes/base/IconoLinea.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type {
  AccionSobrePropuesta,
  ConflictoHorario,
  EstadoPropuesta,
  ValorVoto,
} from '@viajes/compartido';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../../componentes/base/EstadoVacio.vue';
import SiluetaCarga from '../../componentes/base/SiluetaCarga.vue';
import AvisoSuperposicion from '../../componentes/actividades/AvisoSuperposicion.vue';
import RenglonActividad from '../../componentes/actividades/RenglonActividad.vue';
import CalendarioViaje from '../../componentes/itinerario/CalendarioViaje.vue';
import FiltroEstados from '../../componentes/propuestas/FiltroEstados.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useCarga } from '../../composables/useCarga';
import { useCelebracion } from '../../composables/useCelebracion';
import { usePropuestasStore } from '../../stores/propuestas';
import { useViajeStore } from '../../stores/viajes';
import { agruparOpciones } from '../../utiles/actividades';
import { diaInicial, diasEntre, hoyDelDispositivo, nombreDelDia } from '../../utiles/fechas';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const route = useRoute();
const router = useRouter();
const actual = viaje.actual!;
const hoy = hoyDelDispositivo();
const error = ref('');
const conflictos = ref<ConflictoHorario[]>([]);

/**
 * Se ve un día por vez, elegido en el calendario. Abre en hoy si es parte del viaje y, si no, en el
 * primer día con propuestas (como el cronograma, RN-C4); el día va en `?dia=` para no perderlo al
 * recargar.
 */
const diasConPropuestas = computed(() => [
  ...new Set(propuestas.actividades.flatMap((a) => (a.actividad.fecha ? [a.actividad.fecha] : []))),
]);
const elegido = computed(() => {
  const dias = diasEntre(actual.fechaInicio, actual.fechaFin);
  const pedido = route.query['dia'];
  if (typeof pedido === 'string' && dias.includes(pedido)) return pedido;
  return diaInicial(dias, [...diasConPropuestas.value].sort(), hoy);
});
async function elegir(fecha: string) {
  await router.replace({ query: { dia: fecha } });
}
const delDia = computed(() =>
  propuestas.actividades.filter((a) => a.actividad.fecha === elegido.value),
);
const pendientes = computed(() => delDia.value.filter((a) => a.estado === 'PENDIENTE').length);
/** Estados prendidos en el filtro, que cuenta las propuestas del día; sin ninguno se ven todas. */
const estados = ref<EstadoPropuesta[]>([]);
const grupos = computed(() =>
  agruparOpciones(
    estados.value.length
      ? delDia.value.filter((a) => estados.value.includes(a.estado))
      : delDia.value,
  ),
);
const tituloDelDia = computed(() =>
  nombreDelDia(elegido.value).replace(/^./, (c) => c.toUpperCase()),
);
const cantidadDelDia = computed(() => {
  const n = delDia.value.length;
  const total = n === 1 ? '1 propuesta' : `${n} propuestas`;
  const p = pendientes.value;
  return p ? `${total} · ${p === 1 ? '1 pendiente' : `${p} pendientes`}` : total;
});

/** Hasta la primera carga no se muestra la lista vacía. */
const {
  cargado,
  error: errorDeCarga,
  cargar,
  reintentar,
} = useCarga(async () => {
  await propuestas.cargarActividades();
  // El día que se abrió también va a la dirección, para conservarlo al recargar.
  if (route.query['dia'] !== elegido.value) await elegir(elegido.value);
});

/** Hay un voto o una resolución en curso: un segundo clic no manda otro pedido. */
const ocupado = ref(false);

async function intentar(accion: () => Promise<void>) {
  if (ocupado.value) return;
  ocupado.value = true;
  error.value = '';
  conflictos.value = [];
  try {
    await accion();
  } catch (e) {
    // RN-R3: si al confirmar choca con otra confirmada, se muestra con qué.
    if (e instanceof ErrorDeApi && e.codigo === 'SUPERPOSICION_HORARIA') {
      conflictos.value = (e.detalles as { conflictos: ConflictoHorario[] }).conflictos;
    } else {
      error.value = mensajeDeError(e);
      // La propuesta cambió de estado mientras la lista estaba abierta: se muestra cómo quedó.
      if (e instanceof ErrorDeApi && e.estado === 409) {
        await propuestas.cargarActividades().catch(() => undefined);
      }
    }
  } finally {
    ocupado.value = false;
  }
}

const votar = (id: string, valor: ValorVoto) => intentar(() => propuestas.votar(id, valor));
const desvotar = (id: string) => intentar(() => propuestas.desvotar(id));
const { celebrar } = useCelebracion();
const resolver = (id: string, accion: AccionSobrePropuesta) =>
  intentar(async () => {
    await propuestas.resolver(id, accion);
    const titulo = propuestas.actividades.find((a) => a.id === id)?.actividad.titulo;
    if (accion === 'confirmar' && titulo) celebrar(`¡Confirmaron ${titulo}!`);
  });

onMounted(cargar);
</script>

<template>
  <section>
    <div class="encabezado">
      <h2>Actividades</h2>
      <RouterLink
        class="boton boton--principal accion-flotante"
        :to="`/viajes/${actual.id}/actividades/nueva`"
      >
        <IconoLinea nombre="mas" :tamano="20" /><span class="accion-flotante__texto"
          >Proponer actividad</span
        >
      </RouterLink>
    </div>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <AvisoSuperposicion v-if="conflictos.length" :conflictos="conflictos">
      Para confirmarla, primero hay que cancelar la actividad que ocupa ese horario.
    </AvisoSuperposicion>
    <SiluetaCarga v-if="!cargado" />
    <AvisoMensaje v-else-if="errorDeCarga" tipo="error" :reintentar="reintentar">{{
      errorDeCarga
    }}</AvisoMensaje>
    <EstadoVacio
      v-else-if="!propuestas.actividades.length"
      icono="🧭"
      titulo="Todavía no hay actividades propuestas."
      descripcion="Proponé qué hacer y cuándo; si a alguien se le ocurre otra cosa para ese momento, puede sumar una alternativa."
    >
      <RouterLink class="boton" :to="`/viajes/${actual.id}/actividades/nueva`">
        Proponer la primera
      </RouterLink>
    </EstadoVacio>
    <div v-else class="grilla grilla--calendario">
      <CalendarioViaje
        :inicio="actual.fechaInicio"
        :fin="actual.fechaFin"
        :seleccionado="elegido"
        :dias-con-actividad="diasConPropuestas"
        :hoy="hoy"
        @elegir="elegir"
      />
      <!-- En escritorio, a todo el ancho por encima de la lista y el calendario. -->
      <div v-if="delDia.length" class="grilla__arriba">
        <FiltroEstados v-model="estados" :propuestas="delDia" femenino />
      </div>
      <div>
        <h3 class="dia">
          {{ tituloDelDia }} <span class="dia__cantidad">{{ cantidadDelDia }}</span>
        </h3>
        <EstadoVacio
          v-if="!delDia.length"
          icono="🗓️"
          titulo="No hay actividades propuestas para este día."
          descripcion="Elegí otro día en el calendario o proponé una."
        />
        <EstadoVacio
          v-else-if="!grupos.length"
          icono="🔎"
          titulo="No hay actividades con esos estados este día."
          descripcion="Probá mostrando todas."
        />
        <ul v-else class="renglones panel">
          <template v-for="g in grupos" :key="g.actividad.id">
            <RenglonActividad
              v-for="(a, i) in [g.actividad, ...g.alternativas]"
              :key="a.id"
              :actividad="a"
              :alternativa="i > 0"
              :soy-admin="viaje.soyAdmin"
              :moneda="actual.moneda"
              :viaje-id="actual.id"
              :ocupada="ocupado"
              @votar="votar"
              @desvotar="desvotar"
              @resolver="resolver"
            />
          </template>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dia {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--esp-2);
  margin: 0 0 var(--esp-3);
  font-size: 1.125rem;
}
.dia__cantidad {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-texto-secundario);
}
.renglones {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
}
</style>
