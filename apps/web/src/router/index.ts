import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router';
import { useSesionStore } from '../stores/sesion';

export const rutas: RouteRecordRaw[] = [
  { path: '/', redirect: '/viajes' },
  {
    path: '/ingresar',
    component: () => import('../vistas/IngresoVista.vue'),
    meta: { publica: true },
  },
  {
    path: '/registrarse',
    component: () => import('../vistas/RegistroVista.vue'),
    meta: { publica: true },
  },
  { path: '/viajes', component: () => import('../vistas/ViajesVista.vue') },
  {
    path: '/viajes/:viajeId',
    component: () => import('../vistas/ViajeLayout.vue'),
    children: [
      { path: '', redirect: (to) => `/viajes/${String(to.params['viajeId'])}/participantes` },
      { path: 'participantes', component: () => import('../vistas/ParticipantesVista.vue') },
      { path: 'alojamientos', component: () => import('../vistas/AlojamientosVista.vue') },
      {
        path: 'alojamientos/nuevo',
        component: () => import('../vistas/AlojamientoFormularioVista.vue'),
      },
      { path: 'actividades', component: () => import('../vistas/ActividadesVista.vue') },
      {
        path: 'actividades/nueva',
        component: () => import('../vistas/ActividadFormularioVista.vue'),
      },
      {
        path: 'actividades/:actividadId/alternativa',
        component: () => import('../vistas/ActividadFormularioVista.vue'),
      },
      { path: 'cronograma', component: () => import('../vistas/CronogramaVista.vue') },
      { path: 'mapa', component: () => import('../vistas/MapaVista.vue') },
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
  return router;
}
