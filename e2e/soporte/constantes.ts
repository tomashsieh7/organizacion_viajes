export const PUERTO_API = 3100;
export const PUERTO_WEB = 5273;
export const ORIGEN_WEB = `http://localhost:${PUERTO_WEB}`;
export const URL_BASE_E2E =
  process.env['DATABASE_URL_E2E'] ?? 'postgresql://viajes:viajes@localhost:5433/viajes_e2e';
