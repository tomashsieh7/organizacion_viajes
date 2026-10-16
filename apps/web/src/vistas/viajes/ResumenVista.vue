<script setup lang="ts">
import { computed, onMounted } from 'vue';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import IconoLinea, { type NombreIcono } from '../../componentes/base/IconoLinea.vue';
import SiluetaCarga from '../../componentes/base/SiluetaCarga.vue';
import AnilloProgreso from '../../componentes/viajes/AnilloProgreso.vue';
import ListaHitos from '../../componentes/viajes/ListaHitos.vue';
import { useCarga } from '../../composables/useCarga';
import { useCelebracion } from '../../composables/useCelebracion';
import { usePropuestasStore } from '../../stores/propuestas';
import { useViajeStore } from '../../stores/viajes';
import { nombreDelDia } from '../../utiles/fechas';
import { calcularProgreso, type ClaveHito } from '../../utiles/progreso';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const { celebrar } = useCelebracion();
const actual = viaje.actual!;
const ruta = (seccion: string) => `/viajes/${actual.id}/${seccion}`;

const progreso = computed(() =>
  calcularProgreso({
    viaje: viaje.actual ?? actual,
    alojamientos: propuestas.alojamientos,
    actividades: propuestas.actividades,
  }),
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

/** "jueves 10 dic y viernes 11 dic", o "jueves 10 dic, viernes 11 dic y otras" si hay más. */
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
/** Una sola acción destacada; las demás quedan plegadas debajo. */
const principal = computed(() => pasos.value[0]);
const otros = computed(() => pasos.value.slice(1));

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

const { cargado, error, cargar, reintentar } = useCarga(async () => {
  await propuestas.cargarTodo();
  celebrarSiTermino();
});
onMounted(cargar);
</script>

<template>
  <section>
    <h2 class="solo-lectores">Resumen</h2>
    <SiluetaCarga v-if="!cargado" :cantidad="2" />
    <AvisoMensaje v-else-if="error" tipo="error" :reintentar="reintentar">{{ error }}</AvisoMensaje>
    <div v-else class="columna">
      <!-- Una sola acción destacada por pantalla; el detalle se despliega al tocar. -->
      <section class="panel" aria-labelledby="titulo-proximo">
        <h3 id="titulo-proximo">Lo próximo</h3>
        <template v-if="principal">
          <div class="paso paso--principal">
            <span class="paso__icono"><IconoLinea :nombre="principal.icono" :tamano="22" /></span>
            <span class="paso__texto"
              ><strong>{{ principal.titulo }}</strong
              ><span>{{ principal.detalle }}</span></span
            >
            <RouterLink :to="principal.ruta" class="boton boton--principal">{{
              principal.accion
            }}</RouterLink>
          </div>
          <details v-if="otros.length" class="desplegable">
            <summary>
              Ver {{ otros.length === 1 ? '1 paso más' : `${otros.length} pasos más` }}
            </summary>
            <ul class="pasos">
              <li v-for="p in otros" :key="p.titulo" class="paso">
                <span class="paso__icono"><IconoLinea :nombre="p.icono" :tamano="20" /></span>
                <span class="paso__texto"
                  ><strong>{{ p.titulo }}</strong
                  ><span>{{ p.detalle }}</span></span
                >
                <RouterLink :to="p.ruta" class="boton boton--chico">{{ p.accion }}</RouterLink>
              </li>
            </ul>
          </details>
        </template>
        <p v-else class="texto-secundario">No queda nada pendiente. ¡A disfrutar el viaje!</p>
      </section>

      <section class="panel" aria-labelledby="titulo-progreso">
        <div class="progreso">
          <AnilloProgreso :porcentaje="progreso.porcentaje" compacto />
          <div>
            <h3 id="titulo-progreso">{{ mensaje }}</h3>
            <p class="texto-secundario">
              {{ hechos }} de {{ progreso.hitos.length }} hitos del viaje listos
            </p>
          </div>
        </div>
        <details class="desplegable">
          <summary>Ver los hitos</summary>
          <ListaHitos :hitos="progreso.hitos" :enlaces="enlaces" />
        </details>
      </section>
    </div>
  </section>
</template>

<style scoped>
.columna {
  display: grid;
  gap: var(--esp-4);
  max-width: 44rem;
}
/* Sin esto, el contenido de una celda puede ensanchar la grilla más que la pantalla. */
.columna > * {
  min-width: 0;
}
.columna h3 {
  margin: 0 0 var(--esp-3);
}
.progreso {
  display: flex;
  gap: var(--esp-4);
  align-items: center;
}
.progreso h3 {
  font-size: 1.2rem;
  margin-bottom: var(--esp-1);
}
.progreso p {
  margin: 0;
}
.pasos {
  list-style: none;
  padding: 0;
  margin: var(--esp-3) 0 0;
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
.paso--principal {
  border-color: var(--color-acento);
  background: var(--color-acento-suave);
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
.paso--principal .paso__icono {
  background: var(--color-superficie);
}
/* En celular, el botón de la acción principal ocupa todo el ancho, debajo del texto. */
@media (max-width: 47.99rem) {
  .paso--principal .boton {
    flex-basis: 100%;
  }
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
/* El desplegable se nota tocable: flecha que gira y zona de toque de un control. */
.desplegable {
  margin-top: var(--esp-3);
}
.desplegable summary {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  min-height: var(--alto-control);
  color: var(--color-acento);
  font-weight: 600;
  cursor: pointer;
  list-style: none;
}
.desplegable summary::-webkit-details-marker {
  display: none;
}
.desplegable summary::before {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(-45deg);
  transition: transform var(--duracion);
}
.desplegable[open] summary::before {
  transform: rotate(45deg);
}
</style>
