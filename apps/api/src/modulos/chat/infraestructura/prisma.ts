import type { MensajeVista, PaginaDeMensajes } from '@viajes/compartido';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import type { Mensaje } from '../dominio/mensaje.js';
import type { ConsultaMensajes, RepositorioMensajes } from '../dominio/puertos.js';

export class RepositorioMensajesPrisma implements RepositorioMensajes {
  constructor(private readonly db: ClientePrisma) {}

  async guardar(mensaje: Mensaje): Promise<void> {
    await this.db.mensaje.create({ data: mensaje.aDatos() });
  }
}

const INCLUIR = { autor: { select: { id: true, nombre: true, apodo: true } } } as const;

function aVista(f: {
  id: string;
  viajeId: string;
  contenido: string;
  enviadoEn: Date;
  autor: { id: string; nombre: string; apodo: string | null };
}): MensajeVista {
  return {
    id: f.id,
    viajeId: f.viajeId,
    autor: f.autor,
    contenido: f.contenido,
    enviadoEn: f.enviadoEn.toISOString(),
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
