# Organizador de viajes en grupo

MVP de un organizador de viajes en grupo para la materia Arquitectura de Aplicaciones Web (UTDT). El diseño está en `docs/diagramas.drawio`, el plan de implementación en `PLAN.md` y el registro de trabajo en `LOG.md`.

## Requisitos

- Node.js 22 o superior (incluye npm).
- Docker con Docker Compose, para las bases de datos.

## Estructura

- `apps/api`: backend en Express y TypeScript.
- `apps/web`: frontend en Vue 3, Vite, Vue Router y Pinia.
- `packages/compartido`: tipos y contratos que usan ambos lados.
- `docs/`: diagramas del diseño.

## Cómo levantarlo

```bash
npm install
cp .env.example apps/api/.env   # opcional: sin archivo se usan los valores por defecto
docker compose up -d            # PostgreSQL de desarrollo (5432) y de pruebas (5433)
npm run dev                     # API en http://localhost:3000 y web en http://localhost:5173
```

La web redirige `/api` al backend, así que en desarrollo alcanza con abrir `http://localhost:5173`.

## Datos de ejemplo

`npm run db:reset` borra la base de desarrollo, aplica las migraciones y carga la semilla: un viaje a Bariloche con cuatro viajeros. Se puede ingresar con `ana@ejemplo.com`, `tomas@ejemplo.com`, `luis@ejemplo.com` o `sofia@ejemplo.com`, todos con la contraseña `viaje-de-prueba-2026`. Nunca lo ejecutes contra una base con datos reales.

## Pruebas

`npm test` corre las pruebas rápidas y las que usan la base de prueba (`docker compose up -d` tiene que estar levantado). La API y la referencia de endpoints están en `docs/api.md`.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta el paquete compartido en modo observación, la API y la web. |
| `npm run build` | Compila los tres paquetes. |
| `npm test` | Corre las pruebas del backend y del frontend con Vitest. |
| `npm run lint` | ESLint, verificación de formato con Prettier y chequeo de tipos. |
| `npm run format` | Aplica el formato de Prettier. |
| `npm run db:reset` | Resetea la base de desarrollo y carga la semilla. |
