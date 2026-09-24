import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import InicioVista from '../vistas/InicioVista.vue';

export const rutas: RouteRecordRaw[] = [{ path: '/', name: 'inicio', component: InicioVista }];

export function crearRouter() {
  return createRouter({ history: createWebHistory(), routes: rutas });
}
