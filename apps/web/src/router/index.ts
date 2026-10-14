import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { useSesionStore } from '../stores/sesion';

const TITULO_APP = 'Organizador de viajes';

const rutas: RouteRecordRaw[] = [
  { path: '/', redirect: '/viajes' },
  {
    path: '/ingresar',
    component: () => import('../vistas/IngresoVista.vue'),
    meta: { publica: true, titulo: 'Ingresar' },
  },
  {
    path: '/registrarse',
    component: () => import('../vistas/RegistroVista.vue'),
    meta: { publica: true, titulo: 'Crear cuenta' },
  },
  {
    path: '/viajes',
    component: () => import('../vistas/ViajesVista.vue'),
    meta: { titulo: 'Mis grupos de viaje' },
  },
  {
    path: '/viajes/:viajeId',
    component: () => import('../vistas/ViajeLayout.vue'),
    children: [
      { path: '', redirect: (to) => `/viajes/${String(to.params['viajeId'])}/resumen` },
      {
        path: 'resumen',
        component: () => import('../vistas/ResumenVista.vue'),
        meta: { titulo: 'Resumen' },
      },
      {
        path: 'participantes',
        component: () => import('../vistas/ParticipantesVista.vue'),
        meta: { titulo: 'Participantes' },
      },
      {
        path: 'alojamientos',
        component: () => import('../vistas/AlojamientosVista.vue'),
        meta: { titulo: 'Alojamientos' },
      },
      {
        path: 'alojamientos/nuevo',
        component: () => import('../vistas/AlojamientoFormularioVista.vue'),
        meta: { titulo: 'Proponer alojamiento' },
      },
      {
        path: 'actividades',
        component: () => import('../vistas/ActividadesVista.vue'),
        meta: { titulo: 'Actividades' },
      },
      {
        path: 'actividades/nueva',
        component: () => import('../vistas/ActividadFormularioVista.vue'),
        meta: { titulo: 'Proponer actividad' },
      },
      {
        path: 'actividades/:actividadId/alternativa',
        component: () => import('../vistas/ActividadFormularioVista.vue'),
        meta: { titulo: 'Proponer alternativa' },
      },
      {
        path: 'cronograma',
        component: () => import('../vistas/CronogramaVista.vue'),
        meta: { titulo: 'Cronograma' },
      },
      {
        path: 'mapa',
        component: () => import('../vistas/MapaVista.vue'),
        meta: { titulo: 'Mapa del día' },
      },
      {
        path: 'chat',
        component: () => import('../vistas/ChatVista.vue'),
        meta: { titulo: 'Chat del grupo' },
      },
      {
        path: 'gastos',
        component: () => import('../vistas/GastosVista.vue'),
        meta: { titulo: 'Gastos' },
      },
      {
        path: 'gastos/nuevo',
        component: () => import('../vistas/GastoFormularioVista.vue'),
        meta: { titulo: 'Anotar gasto' },
      },
      {
        path: 'saldos',
        component: () => import('../vistas/SaldosVista.vue'),
        meta: { titulo: 'Saldos' },
      },
      {
        path: 'saldos/pagar/:acreedorId',
        component: () => import('../vistas/PagoVista.vue'),
        meta: { titulo: 'Registrar pago' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/viajes' },
];

/** Crea el router con la guarda de sesión: las rutas no públicas exigen haber ingresado. */
export function crearRouter(): Router {
  const router = createRouter({ history: createWebHistory(), routes: rutas });
  router.beforeEach(async (to) => {
    const sesion = useSesionStore();
    await sesion.cargar();
    if (!to.meta['publica'] && !sesion.autenticado) {
      return { path: '/ingresar', query: to.fullPath === '/viajes' ? {} : { volver: to.fullPath } };
    }
    if (to.meta['publica'] && sesion.autenticado) return '/viajes';
    return true;
  });
  // WCAG 2.4.2: cada página tiene su propio título, así se distinguen las pestañas y los lectores
  // de pantalla anuncian adónde se llegó.
  router.afterEach((to) => {
    const titulo = to.meta['titulo'];
    document.title = typeof titulo === 'string' ? `${titulo} · ${TITULO_APP}` : TITULO_APP;
  });
  return router;
}
