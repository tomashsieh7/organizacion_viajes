import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import type { DatosInicioSesion, DatosRegistro, Usuario } from '@viajes/compartido';
import { CLIENTE_AUTH } from '../clientes/auth';

/** Sesión del usuario actual. */
export const useSesionStore = defineStore('sesion', () => {
  const cliente = inject(CLIENTE_AUTH);
  if (!cliente) throw new Error('Falta inyectar ClienteAuth');

  const usuario = ref<Usuario | null>(null);
  const cargada = ref(false);
  const autenticado = computed(() => usuario.value !== null);

  /**
   * Consulta la sesión una sola vez; las guardas de ruta la llaman antes de decidir. Si el servidor
   * no responde, se trata como sin sesión y se vuelve a consultar en la próxima navegación, así la
   * aplicación no queda en blanco por una falla momentánea.
   */
  async function cargar(): Promise<void> {
    if (cargada.value) return;
    try {
      usuario.value = await cliente!.yo();
      cargada.value = true;
    } catch {
      usuario.value = null;
    }
  }

  async function ingresar(datos: DatosInicioSesion) {
    usuario.value = await cliente!.ingresar(datos);
    cargada.value = true;
  }

  async function registrarse(datos: DatosRegistro) {
    usuario.value = await cliente!.registrarse(datos);
    cargada.value = true;
  }

  /** Mientras se cierra la sesión a pedido de la persona, el corte del chat no es una pérdida. */
  let cerrando = false;

  /**
   * El servidor avisó que la sesión ya no vale: se olvida el usuario sin volver a consultar.
   * Devuelve si había una sesión que perder, para avisarle a la persona solo en ese caso.
   */
  function perder(): boolean {
    if (!usuario.value || cerrando) return false;
    usuario.value = null;
    return true;
  }

  async function cerrarSesion() {
    cerrando = true;
    try {
      await cliente!.cerrarSesion();
      usuario.value = null;
    } finally {
      cerrando = false;
    }
  }

  return { usuario, autenticado, cargar, ingresar, registrarse, perder, cerrarSesion };
});
