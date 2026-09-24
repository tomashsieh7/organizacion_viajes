import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import type { GeneradorDeTokens, HasheadorDeContrasenas } from '../dominio/puertos.js';

/** argon2id con los parámetros por defecto de la librería, que siguen el mínimo de OWASP (D5). */
export class HasheadorArgon2 implements HasheadorDeContrasenas {
  hashear(contrasena: string): Promise<string> {
    return hash(contrasena);
  }

  verificar(hashGuardado: string, contrasena: string): Promise<boolean> {
    return verify(hashGuardado, contrasena).catch(() => false);
  }
}

export class GeneradorDeTokensCripto implements GeneradorDeTokens {
  generar(): string {
    return randomBytes(32).toString('base64url');
  }

  hashear(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
