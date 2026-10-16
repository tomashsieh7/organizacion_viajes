import { createHash, randomBytes } from 'node:crypto';
import type { GeneradorDeTokens } from '../dominio/puertos.js';

export class GeneradorDeTokensCripto implements GeneradorDeTokens {
  generar(): string {
    return randomBytes(32).toString('base64url');
  }

  hashear(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
