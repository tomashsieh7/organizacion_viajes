import type {
  EmojiReaccion,
  MensajeVista,
  PaginaDeMensajes,
  PersonaVista,
  ReaccionVista,
} from '@viajes/compartido';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import type { Mensaje } from '../dominio/mensaje.js';
import type {
  ConsultaMensajes,
  RegistroDeLectura,
  RepositorioMensajes,
  RepositorioReacciones,
} from '../dominio/puertos.js';

export class RepositorioMensajesPrisma implements RepositorioMensajes {
  constructor(private readonly db: ClientePrisma) {}

  async guardar(mensaje: Mensaje): Promise<void> {
    await this.db.mensaje.create({ data: mensaje.aDatos() });
  }
}

export class RepositorioReaccionesPrisma implements RepositorioReacciones {
  constructor(private readonly db: ClientePrisma) {}

  async poner(mensajeId: string, usuarioId: string, emoji: EmojiReaccion, ahora: Date) {
    await this.db.reaccion.upsert({
      where: { mensajeId_usuarioId: { mensajeId, usuarioId } },
      create: { mensajeId, usuarioId, emoji, creadaEn: ahora },
      update: { emoji, creadaEn: ahora },
    });
  }

  async quitar(mensajeId: string, usuarioId: string) {
    await this.db.reaccion.deleteMany({ where: { mensajeId, usuarioId } });
  }
}

/** Escribe solo la marca de lectura de la membresía; el resto lo administra el módulo de viajes. */
export class RegistroDeLecturaPrisma implements RegistroDeLectura {
  constructor(private readonly db: ClientePrisma) {}

  async marcar(viajeId: string, usuarioId: string, hasta: Date): Promise<void> {
    // GREATEST ignora el NULL de quien nunca abrió el chat.
    await this.db.$executeRaw`
      UPDATE membresia SET chat_leido_hasta = GREATEST(chat_leido_hasta, ${hasta})
      WHERE viaje_id = ${viajeId}::uuid AND usuario_id = ${usuarioId}::uuid`;
  }
}

const PERSONA = { select: { id: true, nombre: true, apodo: true } } as const;
const INCLUIR = {
  autor: PERSONA,
  reacciones: {
    include: { usuario: PERSONA },
    orderBy: [{ creadaEn: 'asc' as const }, { usuarioId: 'asc' as const }],
  },
};

/** Agrupa por emoji, en el orden en que se usó cada uno por primera vez. */
function agrupar(reacciones: { emoji: string; usuario: PersonaVista }[]): ReaccionVista[] {
  const grupos = new Map<string, PersonaVista[]>();
  for (const r of reacciones) grupos.set(r.emoji, [...(grupos.get(r.emoji) ?? []), r.usuario]);
  return [...grupos].map(([emoji, usuarios]) => ({ emoji, usuarios }));
}

function aVista(f: {
  id: string;
  viajeId: string;
  contenido: string;
  enviadoEn: Date;
  autor: PersonaVista;
  reacciones: { emoji: string; usuario: PersonaVista }[];
}): MensajeVista {
  return {
    id: f.id,
    viajeId: f.viajeId,
    autor: f.autor,
    contenido: f.contenido,
    enviadoEn: f.enviadoEn.toISOString(),
    reacciones: agrupar(f.reacciones),
  };
}

export class ConsultaMensajesPrisma implements ConsultaMensajes {
  constructor(private readonly db: ClientePrisma) {}

  async obtener(viajeId: string, mensajeId: string): Promise<MensajeVista | null> {
    const f = await this.db.mensaje.findFirst({
      where: { id: mensajeId, viajeId },
      include: INCLUIR,
    });
    return f ? aVista(f) : null;
  }

  async pagina(
    viajeId: string,
    antesDe: string | undefined,
    limite: number,
  ): Promise<PaginaDeMensajes | null> {
    let anteriores = {};
    if (antesDe) {
      const cursor = await this.db.mensaje.findFirst({ where: { id: antesDe, viajeId } });
      if (!cursor) return null;
      // Cursor por (enviado_en, id): dos mensajes del mismo milisegundo no se repiten ni se pierden.
      anteriores = {
        OR: [
          { enviadoEn: { lt: cursor.enviadoEn } },
          { enviadoEn: cursor.enviadoEn, id: { lt: cursor.id } },
        ],
      };
    }
    const filas = await this.db.mensaje.findMany({
      where: { viajeId, ...anteriores },
      include: INCLUIR,
      orderBy: [{ enviadoEn: 'desc' }, { id: 'desc' }],
      take: limite + 1,
    });
    return {
      mensajes: filas.slice(0, limite).reverse().map(aVista),
      hayMas: filas.length > limite,
    };
  }
}
