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

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta el paquete compartido en modo observación, la API y la web. |
| `npm run build` | Compila los tres paquetes. |
| `npm test` | Corre las pruebas del backend y del frontend con Vitest. |
| `npm run lint` | ESLint, verificación de formato con Prettier y chequeo de tipos. |
| `npm run format` | Aplica el formato de Prettier. |
