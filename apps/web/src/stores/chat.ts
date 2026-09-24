import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import type { AvisoMembresiaFinalizada, MensajeVista } from '@viajes/compartido';
import { CLIENTE_CHAT, type ConexionChat } from '../clientes/chat';
import { mensajeDeError } from '../clientes/http';
import { useSesionStore } from './sesion';
import { useViajeStore } from './viaje';

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

  /** Agrega o reemplaza un mensaje; el propio optimista se reconoce por su id temporal. */
  function incorporar(m: MensajeVista) {
    const i = mensajes.value.findIndex(
      (x) =>
        x.id === m.id ||
        (m.idTemporal !== undefined && x.idTemporal === m.idTemporal && x.autor.id === m.autor.id),
    );
    const nuevo: MensajeEnPantalla = { ...m, estado: 'enviado' };
    // Conserva el id temporal propio, que es la clave con la que se dibujó el mensaje.
    const previo = i >= 0 ? mensajes.value[i] : undefined;
    if (previo)
      mensajes.value.splice(
        i,
        1,
        previo.idTemporal ? { ...nuevo, idTemporal: previo.idTemporal } : nuevo,
      );
    else mensajes.value.push(nuevo);
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
      // Lo que se envió mientras la conexión estaba cortada se recupera del historial.
      reconectado: () => void cargarUltimos(),
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

  async function cargarHistorial() {
    if (historialCargado.value) return;
    error.value = '';
    try {
      await cargarUltimos();
    } catch (e) {
      error.value = mensajeDeError(e);
    }
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
    const temporal = crypto.randomUUID();
    mensajes.value.push({
      id: temporal,
      idTemporal: temporal,
      viajeId: viajeId.value,
      autor: { id: sesion.usuario.id, nombre: sesion.usuario.nombre, apodo: sesion.usuario.apodo },
      contenido: contenido.trim(),
      enviadoEn: new Date().toISOString(),
      estado: 'pendiente',
    });
    try {
      incorporar(
        await conexion.enviar({ viajeId: viajeId.value, contenido, idTemporal: temporal }),
      );
    } catch (e) {
      const m = mensajes.value.find((x) => x.idTemporal === temporal && x.estado === 'pendiente');
      if (m) m.estado = 'error';
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
  };
});
