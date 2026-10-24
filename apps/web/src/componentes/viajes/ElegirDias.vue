<script setup lang="ts">
import type { PlanDeReacomodo, PropuestaFueraDeFechas } from '@viajes/compartido';
import { computed } from 'vue';
import { diasEntre, nombreDelDia } from '../../utiles/fechas';

const props = defineProps<{
  modelValue: PlanDeReacomodo;
  propuestas: PropuestaFueraDeFechas[];
  inicio: string;
  fin: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [plan: PlanDeReacomodo] }>();
const dias = computed(() => [...new Set(props.propuestas.map((p) => p.desde))].sort());
const destinos = computed(() => diasEntre(props.inicio, props.fin));
const cantidad = (dia: string) => props.propuestas.filter((p) => p.desde === dia).length;
function cambiar(dia: string, evento: Event) {
  const valor = (evento.target as HTMLSelectElement).value;
  emit('update:modelValue', { ...props.modelValue, [dia]: valor || null });
}
</script>

<template>
  <div class="dias">
    <div v-for="dia in dias" :key="dia" class="dia">
      <span
        ><strong>{{ nombreDelDia(dia) }}</strong
        ><span class="texto-secundario"
          >{{ cantidad(dia) }} {{ cantidad(dia) === 1 ? 'propuesta' : 'propuestas' }}</span
        ></span
      >
      <div>
        <label :for="`destino-${dia}`">Va a</label
        ><select
          :id="`destino-${dia}`"
          :value="modelValue[dia] ?? ''"
          @change="cambiar(dia, $event)"
        >
          <option value="">Sin día</option>
          <option
            v-for="destino in destinos"
            :key="destino"
            :value="destino"
            :disabled="
              Object.entries(modelValue).some(
                ([origen, valor]) => origen !== dia && valor === destino,
              )
            "
          >
            {{ nombreDelDia(destino) }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dias {
  display: grid;
  gap: var(--esp-3);
  margin: var(--esp-4) 0;
}
.dia {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--esp-3);
  align-items: center;
  padding: var(--esp-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
}
.dia span span {
  display: block;
  font-size: 0.875rem;
}
label {
  display: block;
  font-weight: 600;
}
select {
  width: 100%;
}
</style>
