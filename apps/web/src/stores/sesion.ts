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

  /** Consulta la sesión una sola vez; las guardas de ruta la llaman antes de decidir. */
  async function cargar(): Promise<void> {
    if (cargada.value) return;
    usuario.value = await cliente!.yo();
    cargada.value = true;
  }

  async function ingresar(datos: DatosInicioSesion) {
    usuario.value = await cliente!.ingresar(datos);
    cargada.value = true;
  }

  async function registrarse(datos: DatosRegistro) {
    usuario.value = await cliente!.registrarse(datos);
    cargada.value = true;
  }

  async function cerrarSesion() {
    await cliente!.cerrarSesion();
    usuario.value = null;
  }

  return { usuario, cargada, autenticado, cargar, ingresar, registrarse, cerrarSesion };
});
