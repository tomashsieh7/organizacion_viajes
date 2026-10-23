<script setup lang="ts">
import { computed } from 'vue';
import type { EstadoPropuesta } from '@viajes/compartido';
import IconoLinea from '../base/IconoLinea.vue';
import { ICONOS_ESTADO } from '../../utiles/formato';

/**
 * Filtro por estado con botones directos, cada uno con cuántas propuestas hay en ese estado. Se
 * pueden prender varios estados a la vez; sin ninguno prendido se ven todas, y «Todos» vuelve a
 * eso. En celular cada estado es el ícono de su etiqueta y debajo se lee qué se está mostrando;
 * si los botones no entran en un renglón pasan a dos, así nunca queda uno escondido.
 * `femenino` concuerda con «actividades».
 */
const props = defineProps<{
  propuestas: { estado: EstadoPropuesta }[];
  femenino?: boolean;
}>();
const estados = defineModel<EstadoPropuesta[]>({ required: true });

const NOMBRES: Record<EstadoPropuesta | '', [string, string]> = {
  '': ['Todos', 'Todas'],
  PENDIENTE: ['Pendientes', 'Pendientes'],
  CONFIRMADA: ['Confirmados', 'Confirmadas'],
  DENEGADA: ['Denegados', 'Denegadas'],
  CANCELADA: ['Cancelados', 'Canceladas'],
};
const nombre = (valor: EstadoPropuesta | '') => NOMBRES[valor][props.femenino ? 1 : 0];
const opciones = computed(() =>
  (Object.keys(NOMBRES) as (EstadoPropuesta | '')[]).map((valor) => ({
    valor,
    nombre: nombre(valor),
    cantidad: valor
      ? props.propuestas.filter((p) => p.estado === valor).length
      : props.propuestas.length,
  })),
);

const prendido = (valor: EstadoPropuesta | '') =>
  valor ? estados.value.includes(valor) : !estados.value.length;

function tocar(valor: EstadoPropuesta | '') {
  if (!valor) estados.value = [];
  else if (estados.value.includes(valor)) estados.value = estados.value.filter((e) => e !== valor);
  // Se guardan en el orden de los botones, así el texto de abajo se lee siempre igual.
  else
    estados.value = opciones.value.flatMap((o) =>
      o.valor && (o.valor === valor || estados.value.includes(o.valor)) ? [o.valor] : [],
    );
}

/** «Mostrando pendientes y confirmadas». */
const mostrando = computed(() => {
  const nombres = estados.value.map((e) => nombre(e).toLowerCase());
  if (!nombres.length) return `Mostrando ${nombre('').toLowerCase()}`;
  const ultimo = nombres.pop()!;
  return `Mostrando ${nombres.length ? `${nombres.join(', ')} y ${ultimo}` : ultimo}`;
});
</script>

<template>
  <div class="filtro" role="group" aria-label="Mostrar">
    <button
      v-for="o in opciones"
      :key="o.valor"
      type="button"
      class="filtro__opcion"
      :aria-pressed="prendido(o.valor)"
      @click="tocar(o.valor)"
    >
      <IconoLinea
        v-if="o.valor"
        :nombre="ICONOS_ESTADO[o.valor]"
        :tamano="16"
        class="filtro__icono"
      />
      <span class="filtro__nombre">{{ o.nombre }}</span>
      <span class="filtro__cantidad">{{ o.cantidad }}</span>
    </button>
  </div>
  <!-- Solo en celular, donde los estados son íconos: qué se está mostrando. -->
  <p class="filtro__mostrando" aria-hidden="true">{{ mostrando }}</p>
</template>

<style scoped>
.filtro {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2);
  margin-bottom: var(--esp-4);
}
.filtro__opcion {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: var(--esp-1);
  min-height: 2.5rem;
  padding: 0 var(--esp-4);
  border: 1px solid var(--color-borde-fuerte);
  border-radius: 999px;
  background: var(--color-superficie);
  color: var(--color-texto);
  font: inherit;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.filtro__opcion:hover {
  background: var(--color-superficie-alt);
}
.filtro__opcion[aria-pressed='true'] {
  background: var(--color-acento);
  border-color: var(--color-acento);
  color: var(--color-sobre-acento);
}
.filtro__cantidad {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
/* En escritorio el nombre alcanza; el ícono y el texto de abajo quedan para el celular. */
.filtro__icono,
.filtro__mostrando {
  display: none;
}
@media (max-width: 47.99rem) {
  .filtro {
    gap: 6px;
    margin-bottom: var(--esp-1);
  }
  .filtro__opcion {
    padding: 0 10px;
  }
  .filtro__icono {
    display: inline-block;
  }
  /* El nombre de los estados queda para los lectores de pantalla; se lee en el texto de abajo. */
  .filtro__icono + .filtro__nombre {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .filtro__mostrando {
    display: block;
    margin: 0 0 var(--esp-3);
    font-size: 0.875rem;
    color: var(--color-texto-secundario);
  }
}
</style>
