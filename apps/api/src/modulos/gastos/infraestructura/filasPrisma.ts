import type { PersonaVista } from '@viajes/compartido';

export const PERSONA = { select: { id: true, nombre: true, apodo: true } } as const;

export const persona = (u: PersonaVista): PersonaVista => ({
  id: u.id,
  nombre: u.nombre,
  apodo: u.apodo,
});
