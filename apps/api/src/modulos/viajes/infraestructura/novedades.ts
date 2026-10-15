import type { NovedadViaje, PersonaVista, TipoNovedad } from '@viajes/compartido';
import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import { aMonto } from '../../../compartido/infraestructura/conversiones.js';
import type { ConsultaNovedades, NovedadesDelViaje } from '../dominio/puertos.js';

/** Hasta cuántos caracteres de un mensaje viajan como novedad: la lista muestra una línea. */
const LARGO_TEXTO = 140;

interface FilaNovedad {
  viaje_id: string;
  tipo: TipoNovedad;
  texto: string;
  monto: bigint | null;
  en: Date;
  autor_id: string | null;
  autor_nombre: string | null;
  autor_apodo: string | null;
  contraparte_id: string | null;
  contraparte_nombre: string | null;
  contraparte_apodo: string | null;
}

const persona = (id: string | null, nombre: string | null, apodo: string | null) =>
  id && nombre !== null ? ({ id, nombre, apodo } satisfies PersonaVista) : null;

/**
 * Las dos consultas cubren todos los viajes pedidos de una vez. La última novedad sale de unir
 * mensajes, propuestas, confirmaciones, gastos y los pagos en los que participa el usuario.
 */
export class ConsultaNovedadesPrisma implements ConsultaNovedades {
  constructor(private readonly db: ClientePrisma) {}

  async deViajes(usuarioId: string, viajeIds: string[]): Promise<Map<string, NovedadesDelViaje>> {
    const resultado = new Map<string, NovedadesDelViaje>();
    if (viajeIds.length === 0) return resultado;
    const [sinLeer, ultimas] = await Promise.all([
      this.sinLeer(usuarioId, viajeIds),
      this.ultimas(usuarioId, viajeIds),
    ]);
    for (const id of viajeIds) {
      const f = ultimas.get(id);
      resultado.set(id, {
        mensajesSinLeer: sinLeer.get(id) ?? 0,
        ultimaNovedad: f ? aNovedad(f) : null,
      });
    }
    return resultado;
  }

  /** Mensajes de otros posteriores a la marca de lectura, o al alta si nunca abrió el chat. */
  private async sinLeer(usuarioId: string, viajeIds: string[]): Promise<Map<string, number>> {
    const filas = await this.db.$queryRaw<{ viaje_id: string; cantidad: number }[]>`
      SELECT m.viaje_id, count(*)::int AS cantidad
      FROM mensaje m
      JOIN membresia mb ON mb.viaje_id = m.viaje_id AND mb.usuario_id = ${usuarioId}::uuid
      WHERE m.viaje_id = ANY(${viajeIds}::uuid[])
        AND m.autor_id <> ${usuarioId}::uuid
        AND m.enviado_en > coalesce(mb.chat_leido_hasta, mb.alta_en)
      GROUP BY m.viaje_id`;
    return new Map(filas.map((f) => [f.viaje_id, f.cantidad]));
  }

  private async ultimas(usuarioId: string, viajeIds: string[]): Promise<Map<string, FilaNovedad>> {
    const filas = await this.db.$queryRaw<FilaNovedad[]>`
      SELECT DISTINCT ON (n.viaje_id)
        n.viaje_id, n.tipo, n.texto, n.monto, n.en,
        ua.id AS autor_id, ua.nombre AS autor_nombre, ua.apodo AS autor_apodo,
        uc.id AS contraparte_id, uc.nombre AS contraparte_nombre, uc.apodo AS contraparte_apodo
      FROM (
        SELECT m.viaje_id, 'MENSAJE' AS tipo, m.autor_id, left(m.contenido, ${LARGO_TEXTO}) AS texto,
          NULL::bigint AS monto, NULL::uuid AS contraparte_id, m.enviado_en AS en, m.id
        FROM mensaje m WHERE m.viaje_id = ANY(${viajeIds}::uuid[])
        UNION ALL
        SELECT p.viaje_id, 'PROPUESTA', p.autor_id, coalesce(a.titulo, al.nombre, ''),
          NULL, NULL, p.creada_en, p.id
        FROM propuesta p
        LEFT JOIN actividad a ON a.propuesta_id = p.id
        LEFT JOIN alojamiento al ON al.propuesta_id = p.id
        WHERE p.viaje_id = ANY(${viajeIds}::uuid[])
        UNION ALL
        SELECT p.viaje_id, 'CONFIRMACION', p.resuelta_por_id, coalesce(a.titulo, al.nombre, ''),
          NULL, NULL, p.resuelta_en, p.id
        FROM propuesta p
        LEFT JOIN actividad a ON a.propuesta_id = p.id
        LEFT JOIN alojamiento al ON al.propuesta_id = p.id
        WHERE p.viaje_id = ANY(${viajeIds}::uuid[])
          AND p.estado = 'CONFIRMADA' AND p.resuelta_en IS NOT NULL
        UNION ALL
        SELECT g.viaje_id, 'GASTO', g.registrado_por_id, g.titulo, g.monto, NULL, g.creado_en, g.id
        FROM gasto g WHERE g.viaje_id = ANY(${viajeIds}::uuid[])
        UNION ALL
        -- Un pago es privado entre deudor y acreedor, como en Saldos.
        SELECT d.viaje_id, 'PAGO', d.deudor_id, '', pa.monto, d.acreedor_id, pa.fecha, pa.id
        FROM pago pa JOIN deuda d ON d.id = pa.deuda_id
        WHERE d.viaje_id = ANY(${viajeIds}::uuid[])
          AND ${usuarioId}::uuid IN (d.deudor_id, d.acreedor_id)
      ) n
      LEFT JOIN usuario ua ON ua.id = n.autor_id
      LEFT JOIN usuario uc ON uc.id = n.contraparte_id
      ORDER BY n.viaje_id, n.en DESC, n.id DESC`;
    return new Map(filas.map((f) => [f.viaje_id, f]));
  }
}

function aNovedad(f: FilaNovedad): NovedadViaje {
  return {
    tipo: f.tipo,
    autor: persona(f.autor_id, f.autor_nombre, f.autor_apodo),
    texto: f.texto,
    monto: f.monto === null ? null : aMonto(f.monto),
    contraparte: persona(f.contraparte_id, f.contraparte_nombre, f.contraparte_apodo),
    en: f.en.toISOString(),
  };
}
