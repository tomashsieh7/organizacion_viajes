import { readonly, ref } from 'vue';

export type PreferenciaTema = 'claro' | 'oscuro' | 'automatico';

/** Clave en el almacenamiento del dispositivo; `index.html` la lee antes de dibujar la página. */
export const CLAVE_TEMA = 'tema';
const PREFERENCIAS: readonly PreferenciaTema[] = ['claro', 'oscuro', 'automatico'];

function leerGuardada(): PreferenciaTema {
  try {
    const guardada = localStorage.getItem(CLAVE_TEMA);
    return PREFERENCIAS.find((p) => p === guardada) ?? 'automatico';
  } catch {
    // Sin acceso al almacenamiento (por ejemplo, en navegación privada estricta) se sigue al sistema.
    return 'automatico';
  }
}

const preferencia = ref<PreferenciaTema>('automatico');
/** El modo que se ve ahora: en automático, el del sistema. */
const oscuro = ref(false);
let sistema: MediaQueryList | undefined;

/** Pone `data-tema` en `<html>`: las variables de color de `App.vue` dependen de ese atributo. */
function aplicar() {
  oscuro.value =
    preferencia.value === 'oscuro' || (preferencia.value === 'automatico' && !!sistema?.matches);
  document.documentElement.dataset['tema'] = oscuro.value ? 'oscuro' : 'claro';
}

/** Lo elegido en otra pestaña de la app en el mismo dispositivo vale también en esta. */
function alCambiarOtraPestana(e: StorageEvent) {
  if (e.key !== CLAVE_TEMA && e.key !== null) return;
  preferencia.value = leerGuardada();
  aplicar();
}

/**
 * Modo claro, oscuro o el del sistema, elegido en cada dispositivo (PLAN 7.1.1). En automático,
 * si el sistema cambia de modo mientras la app está abierta, la app cambia con él.
 */
export function useTema() {
  function iniciar() {
    preferencia.value = leerGuardada();
    sistema = window.matchMedia?.('(prefers-color-scheme: dark)');
    sistema?.addEventListener('change', aplicar);
    window.addEventListener('storage', alCambiarOtraPestana);
    aplicar();
  }

  function elegir(nueva: PreferenciaTema) {
    preferencia.value = nueva;
    try {
      localStorage.setItem(CLAVE_TEMA, nueva);
    } catch {
      // Si no se puede guardar, el cambio vale hasta recargar.
    }
    aplicar();
  }

  return { preferencia: readonly(preferencia), oscuro: readonly(oscuro), iniciar, elegir };
}
