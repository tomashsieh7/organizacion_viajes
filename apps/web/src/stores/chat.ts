import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import type {
  AvisoMembresiaFinalizada,
  MensajeVista,
  PersonaVista,
  ReaccionVista,
} from '@viajes/compartido';
import { CLIENTE_CHAT, type ConexionChat } from '../clientes/chat';
import { mensajeDeError } from '../clientes/http';
import { idTemporal } from '../utiles/idTemporal';
import { useSesionStore } from './sesion';
import { useViajeStore } from './viaje';

export interface MensajeEnPantalla extends MensajeVista {
  /** Los propios quedan pendientes hasta que el servidor los confirma. */
  estado: 'enviado' | 'pendiente' | 'error';
}

/** Cuánto dura el aviso de "escribiendo" sin un aviso nuevo de esa persona. */
export const DURACION_ESCRIBIENDO_MS = 5_000;
/** Cada cuánto, como mucho, se avisa que uno está escribiendo. */
export const INTERVALO_AVISO_MS = 3_000;

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
  /** Quiénes están escribiendo, con el temporizador que borra a cada uno. */
  const escribiendo = ref<{ persona: PersonaVista; temporizador: ReturnType<typeof setTimeout> }[]>(
    [],
  );
  const quienesEscriben = computed(() => escribiendo.value.map((e) => e.persona));
  let conexion: ConexionChat | null = null;
  /** Entrada a la sala del viaje abierto; el aviso de escribiendo sale recién cuando termina. */
  let union: Promise<void> = Promise.resolve();
  let ultimoAviso = 0;

  function dejoDeEscribir(usuarioId: string) {
    const i = escribiendo.value.findIndex((e) => e.persona.id === usuarioId);
    if (i < 0) return;
    clearTimeout(escribiendo.value[i]!.temporizador);
    escribiendo.value.splice(i, 1);
  }

  function olvidarEscribiendo() {
    for (const e of escribiendo.value) clearTimeout(e.temporizador);
    escribiendo.value = [];
  }

  function aplicarReacciones(mensajeId: string, reacciones: ReaccionVista[]) {
    const m = mensajes.value.find((x) => x.id === mensajeId);
    if (m) m.reacciones = reacciones;
  }

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
        if (m.viajeId !== viajeId.value) return;
        incorporar(m);
        // Quien manda un mensaje ya no está escribiendo.
        dejoDeEscribir(m.autor.id);
      },
      reacciones: (d) => {
        if (d.viajeId === viajeId.value) aplicarReacciones(d.mensajeId, d.reacciones);
      },
      escribiendo: ({ viajeId: id, usuario }) => {
        if (id !== viajeId.value) return;
        dejoDeEscribir(usuario.id);
        const temporizador = setTimeout(() => dejoDeEscribir(usuario.id), DURACION_ESCRIBIENDO_MS);
        escribiendo.value.push({ persona: usuario, temporizador });
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
    olvidarEscribiendo();
    try {
      union = abrirConexion().unirse(id);
      await union;
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
    olvidarEscribiendo();
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
    // Al llegar el mensaje, el resto deja de ver "escribiendo": el próximo aviso sale enseguida.
    ultimoAviso = 0;
    const temporal = idTemporal();
    mensajes.value.push({
      id: temporal,
      idTemporal: temporal,
      viajeId: viajeId.value,
      autor: { id: sesion.usuario.id, nombre: sesion.usuario.nombre, apodo: sesion.usuario.apodo },
      contenido: contenido.trim(),
      enviadoEn: new Date().toISOString(),
      reacciones: [],
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

  /** Con `null` quita la reacción propia; una por persona, como en el servidor. */
  async function reaccionar(mensajeId: string, emoji: string | null) {
    if (!viajeId.value || !conexion) return;
    try {
      aplicarReacciones(
        mensajeId,
        await conexion.reaccionar({ viajeId: viajeId.value, mensajeId, emoji }),
      );
    } catch (e) {
      error.value = mensajeDeError(e);
    }
  }

  /** Avisa que uno está escribiendo, como mucho una vez cada `INTERVALO_AVISO_MS`. */
  function avisarEscribiendo() {
    const ahora = Date.now();
    const id = viajeId.value;
    const c = conexion;
    if (!id || !c || ahora - ultimoAviso < INTERVALO_AVISO_MS) return;
    ultimoAviso = ahora;
    // Si se escribe apenas se abre el viaje, el servidor todavía no sumó la conexión a la sala
    // y descartaría el aviso.
    union.then(
      () => viajeId.value === id && c.escribiendo(id),
      () => undefined,
    );
  }

  /** Si falla no se avisa: solo cambia el contador de la lista de grupos. */
  async function marcarLeido() {
    if (viajeId.value) await cliente!.marcarLeido(viajeId.value).catch(() => undefined);
  }

  return {
    viajeId,
    mensajes,
    quienesEscriben,
    hayMas,
    error,
    finalizada,
    entrar,
    desconectar,
    cargarHistorial,
    cargarAnteriores,
    enviar,
    reaccionar,
    avisarEscribiendo,
    marcarLeido,
  };
});
