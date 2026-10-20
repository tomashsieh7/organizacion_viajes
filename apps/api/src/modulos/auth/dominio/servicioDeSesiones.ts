import { ErrorDeDominio } from '../../../comun/errores.js';
import type { PublicadorDeEventos } from '../../../comun/eventos.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { SesionCerrada } from './eventos.js';
import type { GeneradorDeTokens, RepositorioSesiones } from './puertos.js';

export interface SesionNueva {
  token: string;
  expiraEn: Date;
}

const noAutenticado = () =>
  new ErrorDeDominio('NO_AUTENTICADO', 'NO_AUTENTICADO', 'Tenés que iniciar sesión');

/** Crea, valida y revoca sesiones guardadas en la base (RN-S5). */
export class ServicioDeSesiones {
  constructor(
    private readonly sesiones: RepositorioSesiones,
    private readonly tokens: GeneradorDeTokens,
    private readonly reloj: Reloj,
    private readonly duracionMs: number,
    private readonly eventos: PublicadorDeEventos,
  ) {}

  /** Crea una sesión nueva y, de paso, borra las terminadas del usuario para que no se acumulen. */
  async crear(usuarioId: string): Promise<SesionNueva> {
    const ahora = this.reloj.ahora();
    await this.sesiones.borrarTerminadas(usuarioId, ahora);
    const token = this.tokens.generar();
    const expiraEn = new Date(ahora.getTime() + this.duracionMs);
    await this.sesiones.crear({ usuarioId, tokenHash: this.tokens.hashear(token), expiraEn });
    return { token, expiraEn };
  }

  /** Devuelve el usuario de una sesión vigente o lanza NO_AUTENTICADO. */
  async validar(token: string | undefined): Promise<string> {
    if (!token) throw noAutenticado();
    const sesion = await this.sesiones.buscarPorTokenHash(this.tokens.hashear(token));
    const ahora = this.reloj.ahora();
    if (!sesion || sesion.revocadaEn || sesion.expiraEn <= ahora) throw noAutenticado();
    return sesion.usuarioId;
  }

  /** Revoca la sesión y avisa, para que se corten las conexiones del chat abiertas con ella. */
  async revocar(token: string | undefined): Promise<void> {
    if (!token) return;
    const tokenHash = this.tokens.hashear(token);
    await this.sesiones.revocar(tokenHash, this.reloj.ahora());
    const evento: SesionCerrada = { tipo: 'auth.sesion-cerrada', tokenHash };
    await this.eventos.publicar(evento);
  }

  /** Identifica una sesión sin guardar su token en claro. */
  hashDeToken(token: string): string {
    return this.tokens.hashear(token);
  }
}
