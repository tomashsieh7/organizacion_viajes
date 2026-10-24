import { aFecha, aHora } from '../../../comun/infraestructura/conversiones.js';

export interface FilaActividad {
  propuestaId: string;
  titulo: string;
  fecha: Date | null;
  fechaCambiadaEn?: Date | null;
  horaInicio: Date;
  duracionMin: number;
  alternativaDeId: string | null;
}

export const detalleDe = (a: FilaActividad) => ({
  titulo: a.titulo,
  fecha: a.fecha ? aFecha(a.fecha) : null,
  fechaCambiadaEn: a.fechaCambiadaEn ?? null,
  horaInicio: aHora(a.horaInicio),
  duracionMin: a.duracionMin,
  alternativaDeId: a.alternativaDeId,
});
