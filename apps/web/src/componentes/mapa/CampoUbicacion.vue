<script setup lang="ts">
import { inject, onBeforeUnmount, ref } from 'vue';
import MapaSelector from './MapaSelector.vue';
import { BUSCADOR_UBICACIONES, type Ubicacion } from '../../clientes/ubicaciones';

export interface ValorUbicacion {
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
}

defineProps<{ error?: string | undefined; obligatorioEnMapa?: boolean }>();
const modelo = defineModel<ValorUbicacion>({ required: true });
const buscador = inject(BUSCADOR_UBICACIONES);

const resultados = ref<Ubicacion[]>([]);
const aviso = ref('');
let espera: ReturnType<typeof setTimeout> | undefined;

/** Busca cuando se deja de escribir, para respetar el límite de uso de Nominatim. */
function alEscribir(texto: string) {
  modelo.value = { ...modelo.value, ubicacion: texto };
  clearTimeout(espera);
  espera = setTimeout(async () => {
    aviso.value = '';
    try {
      resultados.value = (await buscador?.buscar(texto)) ?? [];
    } catch {
      resultados.value = [];
      aviso.value = 'No se pudo buscar el lugar; podés marcarlo con un clic en el mapa.';
    }
  }, 600);
}

function elegir(u: Ubicacion) {
  modelo.value = { ubicacion: u.nombre, latitud: u.latitud, longitud: u.longitud };
  resultados.value = [];
}

function marcar(latitud: number, longitud: number) {
  modelo.value = { ...modelo.value, latitud, longitud };
}

onBeforeUnmount(() => clearTimeout(espera));
</script>

<template>
  <div class="ubicacion">
    <label for="ubicacion">Ubicación</label>
    <input
      id="ubicacion"
      :value="modelo.ubicacion"
      autocomplete="off"
      placeholder="Buscá una dirección o un lugar"
      @input="alEscribir(($event.target as HTMLInputElement).value)"
    />
    <ul v-if="resultados.length" class="resultados" role="listbox">
      <li v-for="r in resultados" :key="`${r.latitud},${r.longitud}`">
        <button type="button" role="option" @click="elegir(r)">{{ r.nombre }}</button>
      </li>
    </ul>
    <p v-if="aviso" class="aviso">{{ aviso }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <MapaSelector :latitud="modelo.latitud" :longitud="modelo.longitud" @elegir="marcar" />
    <small class="ayuda">
      <template v-if="modelo.latitud !== null">Punto marcado en el mapa.</template>
      <template v-else-if="obligatorioEnMapa">Marcá el punto en el mapa.</template>
      <template v-else>El punto en el mapa es opcional.</template>
    </small>
  </div>
</template>

<style scoped>
.ubicacion {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
}
.resultados {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
}
.resultados button {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.45rem 0.6rem;
  cursor: pointer;
  font: inherit;
}
.resultados button:hover {
  background: var(--color-superficie);
}
.aviso {
  color: #57606a;
  margin: 0;
}
.error {
  color: var(--color-error);
  margin: 0;
  font-size: 0.85rem;
}
</style>
