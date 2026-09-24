/** Evento de dominio: algo que ya ocurrió y que a otros módulos les puede interesar. */
export interface EventoDeDominio {
  readonly tipo: string;
}

export type Suscriptor<E extends EventoDeDominio> = (evento: E) => void | Promise<void>;

/** Publica eventos de dominio sin conocer a quienes los reciben (patrón Observer). */
export interface PublicadorDeEventos {
  publicar(evento: EventoDeDominio): Promise<void>;
}

export interface BusDeEventos extends PublicadorDeEventos {
  suscribir<E extends EventoDeDominio>(tipo: E['tipo'], suscriptor: Suscriptor<E>): void;
}

/** Bus en memoria: entrega cada evento a los suscriptores de su tipo, en orden de suscripción. */
export class BusDeEventosEnMemoria implements BusDeEventos {
  private readonly suscriptores = new Map<string, Suscriptor<EventoDeDominio>[]>();

  suscribir<E extends EventoDeDominio>(tipo: E['tipo'], suscriptor: Suscriptor<E>): void {
    const lista = this.suscriptores.get(tipo) ?? [];
    lista.push(suscriptor as Suscriptor<EventoDeDominio>);
    this.suscriptores.set(tipo, lista);
  }

  async publicar(evento: EventoDeDominio): Promise<void> {
    for (const suscriptor of this.suscriptores.get(evento.tipo) ?? []) {
      await suscriptor(evento);
    }
  }
}
