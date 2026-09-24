/** Fuente de la hora actual; las pruebas la reemplazan para controlar vencimientos. */
export interface Reloj {
  ahora(): Date;
}

export const relojDelSistema: Reloj = { ahora: () => new Date() };
