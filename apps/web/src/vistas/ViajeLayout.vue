<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import IconoLinea, { type NombreIcono } from '../componentes/base/IconoLinea.vue';
import { mensajeDeError } from '../clientes/http';
import { useChatStore } from '../stores/chat';
import { useViajeStore } from '../stores/viaje';
import { hoyDelDispositivo } from '../utiles/fechas';
import { formatearRango } from '../utiles/formato';
import { cuentaRegresiva } from '../utiles/progreso';

const store = useViajeStore();
const chat = useChatStore();
const route = useRoute();
const router = useRouter();
const error = ref('');

interface Seccion {
  nombre: string;
  ruta: string;
}
interface Grupo {
  nombre: string;
  icono: NombreIcono;
  secciones: Seccion[];
  /** Rutas que no tienen pestaña propia pero marcan el grupo como activo. */
  tambien?: string[];
}

/**
 * Las secciones se agrupan en cinco destinos, el máximo recomendado para una barra de navegación
 * fija; dentro de cada grupo, las secciones se eligen con pestañas. Participantes se abre desde
 * la portada ("4 viajeros") y cuenta como parte de Inicio.
 */
const GRUPOS: Grupo[] = [
  {
    nombre: 'Inicio',
    icono: 'casa',
    secciones: [{ nombre: 'Resumen', ruta: 'resumen' }],
    tambien: ['participantes'],
  },
  {
    nombre: 'Planificar',
    icono: 'votar',
    secciones: [
      { nombre: 'Alojamientos', ruta: 'alojamientos' },
      { nombre: 'Actividades', ruta: 'actividades' },
    ],
  },
  {
    nombre: 'Itinerario',
    icono: 'calendario',
    secciones: [
      { nombre: 'Cronograma', ruta: 'cronograma' },
      { nombre: 'Mapa', ruta: 'mapa' },
    ],
  },
  { nombre: 'Chat', icono: 'chat', secciones: [{ nombre: 'Chat', ruta: 'chat' }] },
  {
    nombre: 'Cuentas',
    icono: 'cuentas',
    secciones: [
      { nombre: 'Gastos', ruta: 'gastos' },
      { nombre: 'Saldos', ruta: 'saldos' },
    ],
  },
];
const soloSaldos = computed(() => store.actual?.miAcceso === 'SOLO_SALDOS');
// RN-E6: con acceso solo a saldos, la única sección es la de saldos y no hace falta menú.
const grupos = computed(() => (soloSaldos.value ? [] : GRUPOS));

const enlace = (ruta: string) => `/viajes/${store.actual?.id}/${ruta}`;
/** Cronograma y Mapa comparten el día elegido (`?dia=`): las pestañas lo conservan. */
const enlaceSeccion = (ruta: string) => {
  const dia = route.query?.['dia'];
  return grupoActivo.value?.nombre === 'Itinerario' && typeof dia === 'string'
    ? `${enlace(ruta)}?dia=${dia}`
    : enlace(ruta);
};
/** Cuenta regresiva de la portada, con la fecha del dispositivo. */
const cuenta = computed(() =>
  store.actual
    ? cuentaRegresiva(store.actual.fechaInicio, store.actual.fechaFin, hoyDelDispositivo())
    : null,
);
const viajeros = computed(() => {
  const n = store.actual?.cantidadParticipantes ?? 0;
  return `${n} ${n === 1 ? 'viajero' : 'viajeros'}`;
});
/** La sección activa, incluidas sus subrutas (por ejemplo, `gastos/nuevo`). */
const seccionActiva = computed(() => route.path.split('/')[3] ?? '');
const grupoActivo = computed(() =>
  GRUPOS.find(
    (g) =>
      g.secciones.some((s) => s.ruta === seccionActiva.value) ||
      g.tambien?.includes(seccionActiva.value),
  ),
);

/** Con acceso solo a saldos, cualquier otra sección lleva a la de saldos. */
async function exigirSeccionPermitida() {
  if (soloSaldos.value && store.actual && !/\/saldos(\/|$)/.test(route.path)) {
    await router.replace(`/viajes/${store.actual.id}/saldos`);
  }
}

watch(
  () => route.params['viajeId'],
  async (id) => {
    if (typeof id !== 'string') return;
    error.value = '';
    try {
      await store.abrir(id);
      await exigirSeccionPermitida();
      // La conexión en tiempo real acompaña al viaje abierto, en cualquier sección; quien solo
      // ve los saldos ya no está en el chat.
      if (!soloSaldos.value) await chat.entrar(id);
    } catch (e) {
      error.value = mensajeDeError(e);
    }
  },
  { immediate: true },
);
watch(() => route.path, exigirSeccionPermitida);

/**
 * RN-E4 y RN-E6: si la membresía termina mientras el viaje está abierto, se vuelve a la lista;
 * si le quedan saldos pendientes, se queda en la sección de saldos.
 */
watch(
  () => chat.finalizada,
  async (aviso) => {
    if (!aviso || !store.actual) return;
    const { id, nombre } = store.actual;
    const motivo =
      aviso.motivo === 'ELIMINADO'
        ? `El Admin te quitó de «${nombre}».`
        : `Saliste de «${nombre}».`;
    chat.desconectar();
    if (aviso.conservaAccesoSaldos) {
      await store.abrir(id);
      store.aviso = `${motivo} Podés seguir viendo tus saldos hasta que queden en cero.`;
      await router.push(`/viajes/${id}/saldos`);
      return;
    }
    await store.cerrarPorBaja(motivo);
    await router.push('/viajes');
  },
);

onBeforeUnmount(() => {
  chat.desconectar();
  store.aviso = '';
});
</script>

<template>
  <main class="pagina" :class="{ 'con-barra-inferior': grupos.length }">
    <template v-if="error">
      <AvisoMensaje tipo="error">{{ error }}</AvisoMensaje>
      <RouterLink to="/viajes" class="volver">← Volver a mis grupos</RouterLink>
    </template>
    <template v-else-if="store.actual">
      <header class="viaje">
        <!-- Portada neutra: el color es de la aplicación y no sugiere nada sobre el destino. -->
        <!-- Fuera del Resumen, en celular, la portada se achica al nombre y la cuenta regresiva. -->
        <div class="portada" :class="{ 'portada--compacta': seccionActiva !== 'resumen' }">
          <RouterLink to="/viajes" class="volver">← Mis grupos</RouterLink>
          <div class="portada__titulo">
            <h1>{{ store.actual.nombre }}</h1>
            <p v-if="cuenta" class="chip" :class="`chip--${cuenta.etapa}`">
              <IconoLinea nombre="reloj" :tamano="18" /> {{ cuenta.texto }}
            </p>
          </div>
          <p class="portada__datos texto-secundario">
            <span><IconoLinea nombre="pin" :tamano="16" /> {{ store.actual.destino }}</span>
            <span
              ><IconoLinea nombre="calendario" :tamano="16" />
              {{ formatearRango(store.actual.fechaInicio, store.actual.fechaFin) }}</span
            >
            <span v-if="soloSaldos" class="portada__viajeros"
              ><IconoLinea nombre="personas" :tamano="16" /> {{ viajeros }}</span
            >
            <RouterLink
              v-else
              :to="enlace('participantes')"
              class="portada__viajeros"
              :class="{ activo: seccionActiva === 'participantes' }"
              :aria-current="seccionActiva === 'participantes' ? 'page' : undefined"
              ><IconoLinea nombre="personas" :tamano="16" /> {{ viajeros }}</RouterLink
            >
          </p>
        </div>
        <nav v-if="grupos.length" class="grupos" aria-label="Secciones del viaje">
          <RouterLink
            v-for="g in grupos"
            :key="g.nombre"
            :to="enlace(g.secciones[0]!.ruta)"
            class="grupo"
            :class="{ activo: g === grupoActivo }"
            :aria-current="g === grupoActivo ? 'page' : undefined"
          >
            <IconoLinea :nombre="g.icono" class="grupo__icono" :tamano="20" />
            <span class="grupo__nombre">{{ g.nombre }}</span>
          </RouterLink>
        </nav>
        <nav
          v-if="grupoActivo && grupoActivo.secciones.length > 1 && grupos.length"
          class="subsecciones"
          :aria-label="`Secciones de ${grupoActivo.nombre}`"
        >
          <RouterLink
            v-for="s in grupoActivo.secciones"
            :key="s.ruta"
            :to="enlaceSeccion(s.ruta)"
            class="subseccion"
            :class="{ activo: s.ruta === seccionActiva }"
            :aria-current="s.ruta === seccionActiva ? 'page' : undefined"
            >{{ s.nombre }}</RouterLink
          >
        </nav>
      </header>
      <AvisoMensaje v-if="store.aviso" tipo="info">{{ store.aviso }}</AvisoMensaje>
      <!-- Destino de "Saltar al contenido" en las páginas del viaje: después de los menús. -->
      <div id="seccion" tabindex="-1" class="seccion">
        <RouterView />
      </div>
    </template>
    <p v-else role="status">Cargando…</p>
  </main>
</template>

<style scoped>
.seccion:focus {
  outline: none;
}
.viaje {
  margin-bottom: var(--esp-4);
}
.portada {
  position: relative;
  overflow: hidden;
  padding: var(--esp-2) var(--esp-5) var(--esp-5);
  border: 1px solid var(--color-borde);
  border-top: 6px solid var(--color-acento);
  border-radius: var(--radio-grande);
  background:
    radial-gradient(circle at 1px 1px, var(--color-borde) 1.2px, transparent 0) 0 0 / 18px 18px,
    var(--color-superficie);
  box-shadow: var(--sombra);
}
.volver {
  display: inline-flex;
  align-items: center;
  min-height: var(--alto-control);
}
.viaje h1 {
  margin: 0 0 var(--esp-1);
  font-size: 2rem;
}
.portada__titulo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.portada__datos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-1) var(--esp-4);
  margin: 0;
}
/* Participantes se abre desde acá: parece un botón chico para que se note que se puede tocar. */
.portada__viajeros {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-1);
}
a.portada__viajeros {
  min-height: 2.25rem;
  padding: 0 var(--esp-3);
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 999px;
  color: var(--color-texto);
  font-weight: 600;
  text-decoration: none;
}
a.portada__viajeros:hover,
a.portada__viajeros.activo {
  background: var(--color-acento-suave);
  border-color: var(--color-acento);
}
/* La cuenta regresiva es lo primero que se lee debajo del nombre. */
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2);
  margin: 0 0 var(--esp-3);
  padding: var(--esp-2) var(--esp-4);
  border-radius: 999px;
  font-size: 1.05rem;
  font-weight: 700;
  background: var(--color-acento);
  color: var(--color-sobre-acento);
}
.chip--despues {
  background: var(--color-neutro-suave);
  color: var(--color-neutro);
}

/* Escritorio: los cinco grupos como pestañas bajo el título. */
.grupos {
  display: flex;
  gap: var(--esp-1);
  border-bottom: 1px solid var(--color-borde);
  margin-top: var(--esp-3);
}
.grupo {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2);
  min-height: var(--alto-control);
  padding: 0 var(--esp-3);
  color: var(--color-texto-secundario);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
}
.grupo:hover {
  color: var(--color-texto);
}
.grupo.activo {
  color: var(--color-acento);
  border-bottom-color: var(--color-acento);
}

/* Pestañas de las secciones del grupo, como un control segmentado. */
.subsecciones {
  display: inline-flex;
  gap: var(--esp-1);
  padding: var(--esp-1);
  margin-top: var(--esp-4);
  background: var(--color-superficie-alt);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
}
.subseccion {
  display: inline-flex;
  align-items: center;
  min-height: 2.5rem;
  padding: 0 var(--esp-4);
  border-radius: var(--radio);
  color: var(--color-texto-secundario);
  text-decoration: none;
  font-weight: 500;
}
.subseccion.activo {
  background: var(--color-superficie);
  color: var(--color-texto);
  box-shadow: var(--sombra);
}

/* Celular: los grupos pasan a una barra fija abajo, al alcance del pulgar. */
@media (max-width: 47.99rem) {
  .con-barra-inferior {
    padding-bottom: calc(var(--alto-barra-inferior) + env(safe-area-inset-bottom) + var(--esp-4));
  }
  .grupos {
    position: fixed;
    z-index: 30;
    inset: auto 0 0;
    margin: 0;
    gap: 0;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--color-superficie);
    border-top: 1px solid var(--color-borde);
    border-bottom: none;
    box-shadow: var(--sombra-elevada);
  }
  .grupo {
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 0.125rem;
    min-height: var(--alto-barra-inferior);
    padding: var(--esp-1) 0;
    font-size: 0.75rem;
    border-bottom: none;
    border-top: 3px solid transparent;
    margin: 0;
  }
  .grupo.activo {
    border-top-color: var(--color-acento);
    background: var(--color-acento-suave);
  }
  .portada {
    padding: var(--esp-1) var(--esp-4) var(--esp-4);
  }
  .viaje h1 {
    font-size: 1.6rem;
  }
  .portada--compacta {
    padding: 0 var(--esp-4) var(--esp-3);
  }
  .portada--compacta .volver {
    min-height: 2.25rem;
    font-size: 0.875rem;
  }
  .portada--compacta .portada__titulo {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--esp-1) var(--esp-3);
  }
  .portada--compacta h1 {
    margin: 0;
    font-size: 1.25rem;
  }
  .portada--compacta .chip {
    margin: 0;
    padding: var(--esp-1) var(--esp-3);
    font-size: 0.875rem;
  }
  .portada--compacta .portada__datos {
    display: none;
  }
  .subsecciones {
    display: flex;
  }
  .subseccion {
    flex: 1;
    justify-content: center;
  }
}
</style>
