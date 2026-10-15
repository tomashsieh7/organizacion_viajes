<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../componentes/base/EstadoVacio.vue';
import InicialPersona from '../componentes/base/InicialPersona.vue';
import SiluetaCarga from '../componentes/base/SiluetaCarga.vue';
import DialogoNuevoViaje from '../componentes/viajes/DialogoNuevoViaje.vue';
import { mensajeDeError } from '../clientes/http';
import { useSesionStore } from '../stores/sesion';
import { useViajeStore } from '../stores/viaje';
import { hoyDelDispositivo } from '../utiles/fechas';
import { etiquetaDelDia, formatearHora, formatearRango, textoNovedad } from '../utiles/formato';
import { cuentaRegresiva } from '../utiles/progreso';

const store = useViajeStore();
const miId = useSesionStore().usuario?.id ?? '';
const router = useRouter();
const creando = ref(false);
const error = ref('');
/** Hasta la primera carga no se muestra la lista vacía. */
const cargado = ref(false);
const hoy = hoyDelDispositivo();

onMounted(() =>
  store
    .cargarViajes()
    .catch((e) => (error.value = mensajeDeError(e)))
    .finally(() => (cargado.value = true)),
);
// El aviso se muestra una sola vez.
onBeforeUnmount(() => (store.avisoLista = ''));

/** Como en una lista de chats: la hora si fue hoy, si no "Ayer" o la fecha. */
function cuando(instante: string) {
  const dia = etiquetaDelDia(instante);
  return dia === 'Hoy' ? formatearHora(instante) : dia;
}

const sinLeer = (n: number) => (n === 1 ? '1 mensaje sin leer' : `${n} mensajes sin leer`);

function alCrear(viajeId: string) {
  creando.value = false;
  void router.push(`/viajes/${viajeId}`);
}
</script>

<template>
  <main class="pagina">
    <div class="encabezado">
      <h1>Mis grupos de viaje</h1>
      <button class="boton boton--principal" @click="creando = true">Nuevo grupo</button>
    </div>
    <AvisoMensaje v-if="store.avisoLista" tipo="info">{{ store.avisoLista }}</AvisoMensaje>
    <SiluetaCarga v-if="!cargado" :cantidad="2" />
    <AvisoMensaje v-else-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <EstadoVacio
      v-else-if="store.viajes.length === 0"
      icono="🧳"
      titulo="Todavía no participás de ningún viaje."
      descripcion="Creá un grupo para organizar un viaje, o pedile a quien administra uno que te agregue con tu email."
    >
      <button class="boton" type="button" @click="creando = true">Crear mi primer grupo</button>
    </EstadoVacio>
    <ul v-if="store.viajes.length" class="grupos">
      <li v-for="v in store.viajes" :key="v.id">
        <RouterLink
          class="grupo"
          :to="v.miAcceso === 'SOLO_SALDOS' ? `/viajes/${v.id}/saldos` : `/viajes/${v.id}`"
        >
          <InicialPersona :nombre="v.nombre" :tamano="44" />
          <span class="grupo__cuerpo">
            <span class="grupo__fila">
              <strong class="grupo__nombre">{{ v.nombre }}</strong>
              <span v-if="v.miAcceso === 'SOLO_SALDOS'" class="etiqueta">Solo saldos</span>
              <span v-else-if="v.miRol === 'ADMIN'" class="etiqueta">Admin</span>
              <time
                v-if="v.ultimaNovedad"
                class="grupo__cuando"
                :class="{ 'grupo__cuando--nuevo': v.mensajesSinLeer }"
                :datetime="v.ultimaNovedad.en"
                >{{ cuando(v.ultimaNovedad.en) }}</time
              >
            </span>
            <span class="grupo__fila">
              <span class="grupo__novedad">{{
                v.ultimaNovedad
                  ? textoNovedad(v.ultimaNovedad, miId, v.monedaCodigo)
                  : 'Sin novedades todavía'
              }}</span>
              <span v-if="v.mensajesSinLeer" class="grupo__sin-leer">
                <span aria-hidden="true">{{ v.mensajesSinLeer }}</span>
                <span class="solo-lectores">{{ sinLeer(v.mensajesSinLeer) }}</span>
              </span>
            </span>
            <span class="grupo__detalle">
              {{ v.destino }} · {{ formatearRango(v.fechaInicio, v.fechaFin) }} ·
              <span class="grupo__cuenta">{{
                cuentaRegresiva(v.fechaInicio, v.fechaFin, hoy).texto
              }}</span>
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
    <DialogoNuevoViaje v-if="creando" @cerrar="creando = false" @creado="alCrear" />
  </main>
</template>

<style scoped>
/* Lista de grupos como una lista de chats: una fila por viaje, separadas por una línea. */
.grupos {
  list-style: none;
  padding: 0;
  margin: 0;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  overflow: hidden;
}
.grupos li + li {
  border-top: 1px solid var(--color-borde);
}
.grupo {
  display: flex;
  gap: var(--esp-3);
  align-items: center;
  padding: var(--esp-3) var(--esp-4);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--duracion);
}
.grupo:hover {
  background: var(--color-superficie-alt);
}
.grupo__cuerpo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.grupo__fila {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
}
.grupo__nombre {
  font-size: 1.0625rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.grupo__cuando {
  margin-left: auto;
  flex: none;
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
}
.grupo__cuando--nuevo {
  color: var(--color-acento);
  font-weight: 700;
}
/* Una sola línea: lo que no entra se corta con puntos suspensivos. */
.grupo__novedad {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-texto-secundario);
}
.grupo__sin-leer {
  flex: none;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.4rem;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: var(--color-acento);
  color: var(--color-sobre-acento);
  font-size: 0.75rem;
  font-weight: 700;
}
.grupo__detalle {
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
}
.grupo__cuenta {
  font-weight: 700;
  color: var(--color-acento);
}
</style>
