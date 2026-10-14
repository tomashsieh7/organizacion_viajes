import { ref, watch, type WatchSource } from 'vue';

/**
 * Validación de un formulario campo por campo. Cada campo se valida al salir de él (el evento
 * `focusout` del formulario, con el `name` del campo) y, una vez tocado, su error desaparece en
 * cuanto se corrige. Al enviar se validan todos.
 *
 * `problemas` devuelve los errores del estado actual por campo, con el mismo esquema que se usa al
 * enviar, así la validación al salir y la del envío nunca difieren.
 */
export function useValidacion(
  problemas: () => Record<string, string>,
  // Lo que se observa para revalidar: un objeto reactivo o una función que lo lee.
  datos: WatchSource | object,
) {
  const errores = ref<Record<string, string>>({});
  const tocados = new Set<string>();

  function revisarTocados() {
    errores.value = Object.fromEntries(
      Object.entries(problemas()).filter(([campo]) => tocados.has(campo)),
    );
  }

  /** Para `@focusout` en el formulario: valida el campo que se acaba de dejar. */
  function alSalir(evento: FocusEvent) {
    const campo = (evento.target as HTMLElement | null)?.getAttribute('name');
    if (!campo) return;
    tocados.add(campo);
    revisarTocados();
  }

  /** Valida todo antes de enviar; devuelve si se puede enviar. */
  function validarTodo(): boolean {
    const todos = problemas();
    for (const campo of Object.keys(todos)) tocados.add(campo);
    errores.value = todos;
    return Object.keys(todos).length === 0;
  }

  // Mientras se corrige un campo ya tocado, su error se actualiza sin esperar a salir de él.
  watch(datos, () => tocados.size > 0 && revisarTocados(), { deep: true });

  /**
   * Atributos de accesibilidad del campo: inválido y descripto por su mensaje de error y por los
   * textos de ayuda que se indiquen (sus ids), para que el lector de pantalla los lea al entrar.
   */
  function aria(campo: string, id: string, ...ayudas: string[]) {
    const error = errores.value[campo];
    const descripciones = [...(error ? [`${id}-error`] : []), ...ayudas];
    return {
      ...(error ? { 'aria-invalid': 'true' as const } : {}),
      ...(descripciones.length ? { 'aria-describedby': descripciones.join(' ') } : {}),
    };
  }

  return { errores, alSalir, validarTodo, aria };
}
