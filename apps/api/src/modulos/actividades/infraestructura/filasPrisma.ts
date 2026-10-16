import { aFecha, aHora } from '../../../comun/infraestructura/conversiones.js';

export interface FilaActividad {
  propuestaId: string;
  titulo: string;
  fecha: Date;
  horaInicio: Date;
  duracionMin: number;
  alternativaDeId: string | null;
}

export const detalleDe = (a: FilaActividad) => ({
  titulo: a.titulo,
  fecha: aFecha(a.fecha),
  horaInicio: aHora(a.horaInicio),
  duracionMin: a.duracionMin,
  alternativaDeId: a.alternativaDeId,
});
