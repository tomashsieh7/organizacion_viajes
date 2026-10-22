import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import type { AvisoMembresiaFinalizada, MensajeVista } from '@viajes/compartido';
import { CLIENTE_CHAT, type ConexionChat } from '../clientes/chat';
import { mensajeDeError } from '../clientes/http';
import { uuidAlAzar } from '../utiles/uuid';
import { useSesionStore } from './sesion';
import { useViajeStore } from './viajes';

export interface MensajeEnPantalla extends MensajeVista {
  /** Los propios quedan pendientes hasta que el servidor los confirma. */
  estado: 'enviado' | 'pendiente' | 'error';
}

/**
 * Chat del viaje abierto (CU19). La conexión se abre al entrar a un viaje y se cierra al salir,
 * así los avisos de baja y de traspaso llegan desde cualquier sección.
 */
export const useChatStore = defineStore('chat', () => {
  const cliente = inject(CLIENTE_CHAT);
  if (!cliente) throw new Error('Falta inyectar ClienteChat');
  const viaje = useViajeStore();
  const sesion = useSesionStore();

  const viajeId = ref<string | null>(null);
  const mensajes = ref<MensajeEnPantalla[]>([]);
  const hayMas = ref(false);
  const historialCargado = ref(false);
  const error = ref('');
  const finalizada = ref<AvisoMembresiaFinalizada | null>(null);
  let conexion: ConexionChat | null = null;

  /** Si `x` va después de `m` en el orden del servidor: por hora de envío y, a igual hora, por id. */
  const vaDespues = (x: MensajeVista, m: MensajeVista) =>
    x.enviadoEn > m.enviadoEn || (x.enviadoEn === m.enviadoEn && x.id > m.id);

  /**
   * Agrega o reemplaza un mensaje confirmado por el servidor. Los confirmados quedan en el orden del
   * servidor, igual que en el historial; los propios que esperan o fallaron, al final, en el orden
   * en que se escribieron. El propio se reconoce por su id, que eligió el navegador (RN-X9).
   */
  function incorporar(m: MensajeVista) {
    const i = mensajes.value.findIndex((x) => x.id === m.id);
    const habiaFallado = mensajes.value[i]?.estado === 'error';
    if (i >= 0) mensajes.value.splice(i, 1);
    // Si el que figuraba como fallado en realidad llegó y no queda otro fallado, el aviso sobra.
    if (habiaFallado && !mensajes.value.some((x) => x.estado === 'error')) error.value = '';
    const lugar = mensajes.value.findIndex((x) => x.estado !== 'enviado' || vaDespues(x, m));
    mensajes.value.splice(lugar < 0 ? mensajes.value.length : lugar, 0, {
      ...m,
      estado: 'enviado',
    });
  }

  function abrirConexion() {
    conexion ??= cliente!.conectar({
      mensaje: (m) => {
        if (m.viajeId === viajeId.value) incorporar(m);
      },
      membresiaFinalizada: (aviso) => {
        if (aviso.viajeId !== viajeId.value) return;
        finalizada.value = aviso;
      },
      adminCambiado: (aviso) => {
        if (aviso.viajeId === viajeId.value) void viaje.refrescar();
      },
      // Lo que se envió mientras la conexión estaba cortada se recupera del historial, y el aviso
      // de que no había conexión ya no corresponde.
      reconectado: () => {
        error.value = '';
        void cargarUltimos();
      },
    });
    return conexion;
  }

  async function cargarUltimos() {
    if (!viajeId.value) return;
    const pagina = await cliente!.historial(viajeId.value);
    for (const m of pagina.mensajes) incorporar(m);
    if (!historialCargado.value) hayMas.value = pagina.hayMas;
    historialCargado.value = true;
  }

  /** Al entrar a un viaje: se une a su sala para recibir mensajes y avisos. */
  async function entrar(id: string) {
    if (viajeId.value === id) return;
    if (viajeId.value) conexion?.salir(viajeId.value);
    viajeId.value = id;
    mensajes.value = [];
    hayMas.value = false;
    historialCargado.value = false;
    finalizada.value = null;
    error.value = '';
    try {
      await abrirConexion().unirse(id);
    } catch (e) {
      error.value = mensajeDeError(e);
    }
  }

  function desconectar() {
    conexion?.cerrar();
    conexion = null;
    viajeId.value = null;
    mensajes.value = [];
    historialCargado.value = false;
  }

  /** Si falla, la vista muestra el error con la opción de reintentar. */
  async function cargarHistorial() {
    if (!historialCargado.value) await cargarUltimos();
  }

  /** Carga la página anterior al mensaje más viejo que se ve. */
  async function cargarAnteriores() {
    const primero = mensajes.value.find((m) => m.estado === 'enviado');
    if (!viajeId.value || !primero || !hayMas.value) return;
    const pagina = await cliente!.historial(viajeId.value, primero.id);
    const conocidos = new Set(mensajes.value.map((m) => m.id));
    mensajes.value.unshift(
      ...pagina.mensajes
        .filter((m) => !conocidos.has(m.id))
        .map((m) => ({ ...m, estado: 'enviado' as const })),
    );
    hayMas.value = pagina.hayMas;
  }

  /** Muestra el mensaje enseguida y lo reemplaza cuando el servidor lo confirma. */
  async function enviar(contenido: string) {
    if (!viajeId.value || !conexion || !sesion.usuario) return;
    const id = uuidAlAzar();
    mensajes.value.push({
      id,
      viajeId: viajeId.value,
      autor: { id: sesion.usuario.id, nombre: sesion.usuario.nombre, apodo: sesion.usuario.apodo },
      contenido: contenido.trim(),
      enviadoEn: new Date().toISOString(),
      estado: 'pendiente',
    });
    await mandar(id);
  }

  /** Vuelve a mandar un mensaje que no se pudo enviar, con el mismo id para no duplicarlo. */
  async function reintentar(id: string) {
    if (mensajes.value.find((x) => x.id === id)?.estado === 'error') await mandar(id);
  }

  async function mandar(id: string) {
    const m = mensajes.value.find((x) => x.id === id);
    if (!m || !conexion) return;
    m.estado = 'pendiente';
    try {
      incorporar(await conexion.enviar({ id, viajeId: m.viajeId, contenido: m.contenido }));
      // Un envío que sale borra el aviso de uno anterior que falló, como el de esperar unos segundos.
      error.value = '';
    } catch (e) {
      // Si mientras tanto llegó confirmado (por la sala o por el historial), no falló.
      const actual = mensajes.value.find((x) => x.id === id);
      if (actual?.estado !== 'pendiente') return;
      actual.estado = 'error';
      error.value = mensajeDeError(e);
    }
  }

  return {
    viajeId,
    mensajes,
    hayMas,
    error,
    finalizada,
    entrar,
    desconectar,
    cargarHistorial,
    cargarAnteriores,
    enviar,
    reintentar,
  };
});
