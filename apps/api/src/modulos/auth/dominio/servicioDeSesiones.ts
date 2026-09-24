import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { Reloj } from '../../../compartido/reloj.js';
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
  ) {}

  async crear(usuarioId: string): Promise<SesionNueva> {
    const token = this.tokens.generar();
    const expiraEn = new Date(this.reloj.ahora().getTime() + this.duracionMs);
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

  async revocar(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.sesiones.revocar(this.tokens.hashear(token), this.reloj.ahora());
  }
}
