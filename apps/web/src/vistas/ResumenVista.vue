<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import IconoLinea, { type NombreIcono } from '../componentes/base/IconoLinea.vue';
import SiluetaCarga from '../componentes/base/SiluetaCarga.vue';
import AnilloProgreso from '../componentes/viaje/AnilloProgreso.vue';
import ListaHitos from '../componentes/viaje/ListaHitos.vue';
import { mensajeDeError } from '../clientes/http';
import { useCelebracion } from '../composables/useCelebracion';
import { usePropuestasStore } from '../stores/propuestas';
import { useViajeStore } from '../stores/viaje';
import { hoyDelDispositivo, nombreDelDia } from '../utiles/fechas';
import { calcularProgreso, cuentaRegresiva, type ClaveHito } from '../utiles/progreso';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const { celebrar } = useCelebracion();
const cargado = ref(false);
const error = ref('');
const actual = viaje.actual!;
const ruta = (seccion: string) => `/viajes/${actual.id}/${seccion}`;

const progreso = computed(() =>
  calcularProgreso({
    viaje: viaje.actual ?? actual,
    alojamientos: propuestas.alojamientos,
    actividades: propuestas.actividades,
  }),
);
const cuenta = computed(() =>
  cuentaRegresiva(actual.fechaInicio, actual.fechaFin, hoyDelDispositivo()),
);
const hechos = computed(() => progreso.value.hitos.filter((h) => h.hecho).length);
const mensaje = computed(() => {
  const p = progreso.value.porcentaje;
  if (p === 100) return '¡Todo listo para viajar!';
  if (p >= 60) return '¡Van muy bien!';
  if (p >= 25) return 'El viaje va tomando forma';
  return '¡Arranquemos!';
});

/** Dónde se resuelve cada hito pendiente. */
const propuestasConPendientes = computed(() =>
  propuestas.alojamientos.some((a) => a.estado === 'PENDIENTE') ? 'alojamientos' : 'actividades',
);
const enlaces = computed<Partial<Record<ClaveHito, { ruta: string; texto: string }>>>(() => ({
  grupo: { ruta: ruta('participantes'), texto: 'Sumar' },
  noches: { ruta: ruta('alojamientos'), texto: 'Ver' },
  dias: { ruta: ruta('cronograma'), texto: 'Ver días' },
  resueltas: { ruta: ruta(propuestasConPendientes.value), texto: 'Revisar' },
  votos: { ruta: ruta(propuestasConPendientes.value), texto: 'Votar' },
  cuentas: { ruta: ruta('saldos'), texto: 'Ver saldos' },
}));

/** "jueves 10/12 y viernes 11/12", o "jueves 10/12, viernes 11/12 y otras" si hay más. */
const lista = (fechas: string[]) => {
  const nombres = fechas.slice(0, 2).map(nombreDelDia);
  return fechas.length > 2 ? `${nombres.join(', ')} y otras` : nombres.join(' y ');
};

interface Paso {
  icono: NombreIcono;
  titulo: string;
  detalle: string;
  ruta: string;
  accion: string;
}
/** Los próximos pasos: los hitos pendientes más importantes, con la acción que los resuelve. */
const pasos = computed<Paso[]>(() => {
  const p = progreso.value;
  const v = viaje.actual ?? actual;
  const todos: (Paso | false)[] = [
    v.cantidadParticipantes < 2 &&
      viaje.soyAdmin && {
        icono: 'personas',
        titulo: 'Sumá a tus compañeros de viaje',
        detalle: 'Agregalos por su email para planificar juntos',
        ruta: ruta('participantes'),
        accion: 'Agregar',
      },
    p.nochesLibres.length > 0 && {
      icono: 'cama',
      titulo: `${p.nochesLibres.length === 1 ? 'Falta 1 noche' : `Faltan ${p.nochesLibres.length} noches`} de alojamiento`,
      detalle: lista(p.nochesLibres),
      ruta: ruta('alojamientos/nuevo'),
      accion: 'Proponer',
    },
    p.sinMiVoto > 0 && {
      icono: 'votar',
      titulo: `${p.sinMiVoto === 1 ? 'Te falta votar 1 propuesta' : `Te faltan votar ${p.sinMiVoto} propuestas`}`,
      detalle: 'Tu voto ayuda al Admin a decidir',
      ruta: ruta(propuestasConPendientes.value),
      accion: 'Votar',
    },
    p.pendientes > 0 &&
      viaje.soyAdmin && {
        icono: 'bandeja',
        titulo: `${p.pendientes === 1 ? '1 propuesta espera' : `${p.pendientes} propuestas esperan`} tu decisión`,
        detalle: 'Confirmá o denegá según los votos',
        ruta: ruta(propuestasConPendientes.value),
        accion: 'Revisar',
      },
    p.diasLibres.length > 0 && {
      icono: 'mapa',
      titulo: `${p.diasLibres.length === 1 ? '1 día' : `${p.diasLibres.length} días`} sin actividades`,
      detalle: `Libre: ${lista(p.diasLibres)}`,
      ruta: ruta('actividades/nueva'),
      accion: 'Proponer',
    },
    v.miDeudaPendiente > 0 && {
      icono: 'cuentas',
      titulo: 'Tenés deudas por saldar',
      detalle: 'Pagá cuando puedas desde tus saldos',
      ruta: ruta('saldos'),
      accion: 'Ver saldos',
    },
  ];
  return todos.filter((x): x is Paso => x !== false).slice(0, 3);
});

/** El 100 % se celebra una sola vez por viaje en este dispositivo. */
function celebrarSiTermino() {
  if (progreso.value.porcentaje < 100) return;
  const clave = `viaje-listo:${actual.id}`;
  try {
    if (localStorage.getItem(clave)) return;
    localStorage.setItem(clave, '1');
  } catch {
    // Sin almacenamiento disponible se celebra igual; a lo sumo se repite en otra visita.
  }
  celebrar(`¡${actual.nombre} está listo para viajar!`);
}

onMounted(async () => {
  try {
    await propuestas.cargarTodo();
    celebrarSiTermino();
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    cargado.value = true;
  }
});
</script>

<template>
  <section>
    <h2 class="solo-lectores">Resumen</h2>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <SiluetaCarga v-if="!cargado" :cantidad="2" />
    <div v-else-if="!error" class="rejilla">
      <section class="panel" aria-labelledby="titulo-progreso">
        <div class="progreso">
          <AnilloProgreso :porcentaje="progreso.porcentaje" />
          <div>
            <h3 id="titulo-progreso">{{ mensaje }}</h3>
            <p class="texto-secundario">
              Completaron {{ hechos }} de {{ progreso.hitos.length }} hitos del viaje.
            </p>
          </div>
        </div>
        <ListaHitos :hitos="progreso.hitos" :enlaces="enlaces" />
      </section>

      <div class="columna">
        <section class="panel" aria-labelledby="titulo-pasos">
          <h3 id="titulo-pasos">Próximos pasos</h3>
          <ul v-if="pasos.length" class="pasos">
            <li v-for="(p, i) in pasos" :key="p.titulo" class="paso">
              <span class="paso__icono"><IconoLinea :nombre="p.icono" :tamano="22" /></span>
              <span class="paso__texto"
                ><strong>{{ p.titulo }}</strong
                ><span>{{ p.detalle }}</span></span
              >
              <RouterLink
                :to="p.ruta"
                class="boton boton--chico"
                :class="{ 'boton--principal': i === 0 }"
                >{{ p.accion }}</RouterLink
              >
            </li>
          </ul>
          <p v-else class="texto-secundario">No queda nada pendiente. ¡A disfrutar el viaje!</p>
        </section>
        <section class="panel cuenta" aria-label="Cuenta regresiva">
          <template v-if="cuenta.etapa === 'antes'">
            <span class="cuenta__numero">{{ cuenta.dias }}</span>
            <p>
              <strong>{{ cuenta.dias === 1 ? 'día para salir' : 'días para salir' }}</strong>
              <span class="texto-secundario"
                >Empieza el {{ nombreDelDia(actual.fechaInicio) }}</span
              >
            </p>
          </template>
          <template v-else-if="cuenta.etapa === 'durante'">
            <span class="cuenta__numero">{{ cuenta.dia }}</span>
            <p>
              <strong>día de {{ cuenta.total }}</strong>
              <span class="texto-secundario">¡Que lo disfruten!</span>
            </p>
          </template>
          <p v-else>
            <strong>Viaje terminado</strong>
            <span class="texto-secundario">Revisá que las cuentas hayan quedado saldadas.</span>
          </p>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rejilla {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: var(--esp-4);
  align-items: start;
}
/* Sin esto, el contenido de una celda puede ensanchar la grilla más que la pantalla. */
.rejilla > *,
.columna > * {
  min-width: 0;
}
.columna {
  display: grid;
  gap: var(--esp-4);
}
.progreso {
  display: flex;
  gap: var(--esp-4);
  align-items: center;
}
.progreso h3 {
  font-size: 1.3rem;
  margin-bottom: var(--esp-1);
}
.progreso p {
  margin: 0;
}
.pasos {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--esp-2);
}
.paso {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-3);
  align-items: center;
  padding: var(--esp-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
}
.paso__icono {
  flex: none;
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-content: center;
  border-radius: var(--radio);
  background: var(--color-superficie-alt);
  color: var(--color-acento);
}
.paso__texto {
  flex: 1;
  min-width: 0;
}
.paso__texto strong,
.paso__texto span {
  display: block;
}
.paso__texto span {
  font-size: 0.875rem;
  color: var(--color-texto-secundario);
}
.cuenta {
  display: flex;
  gap: var(--esp-4);
  align-items: center;
}
.cuenta p {
  margin: 0;
}
.cuenta p strong,
.cuenta p span {
  display: block;
}
.cuenta__numero {
  font-family: var(--fuente-titulos);
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 1;
  color: var(--color-acento);
}
@media (max-width: 47.99rem) {
  .rejilla {
    grid-template-columns: 1fr;
  }
}
</style>
