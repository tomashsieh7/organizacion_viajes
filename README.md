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

### Probar desde el celular u otra compu

Con el celular conectado al mismo wifi que la compu donde corre la app:

```bash
npm run dev:red
```

El script busca la IP de la compu en la red local y muestra la dirección para abrir en el celular, por ejemplo `http://192.168.0.78:5173`. Si elige mal la IP, se indica a mano: `IP_RED=192.168.0.78 npm run dev:red`.

- **Por qué hace falta:** la API acepta solo los pedidos que vienen del origen configurado en `ORIGEN_WEB`, y Vite atiende únicamente a la misma compu salvo que se le pida otra cosa. `dev:red` resuelve las dos cosas: usa la IP como `ORIGEN_WEB` y hace que Vite atienda a la red.
- **Mientras corre `dev:red`:** en la misma compu también hay que abrir la app con la IP y no con `localhost`, porque la API rechaza el inicio de sesión desde un origen distinto.
- **Si el celular no carga la página:** revisá que esté en el mismo wifi y que el firewall deje pasar el puerto 5173. Algunas redes públicas o de oficina no dejan que los dispositivos se vean entre sí.

## Datos de ejemplo

`npm run db:reset` borra la base de desarrollo, aplica las migraciones y carga la semilla: un viaje a Bariloche con cuatro viajeros. Se puede ingresar con `ana@ejemplo.com`, `tomas@ejemplo.com`, `luis@ejemplo.com` o `sofia@ejemplo.com`, todos con la contraseña `viaje-de-prueba-2026`. Nunca lo ejecutes contra una base con datos reales.

## Pruebas

`npm test` corre las pruebas rápidas y las que usan la base de prueba (`docker compose up -d` tiene que estar levantado). La API y la referencia de endpoints están en `docs/api.md`.

`npm run e2e` corre las pruebas de punta a punta con Playwright en Chromium:
- **Qué levanta:** su propia API y su propia web, en los puertos 3100 y 5273, contra una base aparte (`viajes_e2e`, que se crea sola en el servidor de pruebas). No interfiere con `npm run dev` ni con `npm test`.
- **Requisitos:** `docker compose up -d` levantado y el navegador instalado una vez con `npx playwright install chromium`. Si Chromium ya está instalado en otra ruta, se indica con `E2E_CHROMIUM=/ruta/al/chrome npm run e2e`.
- **Si algo falla:** el informe queda en `playwright-report/`.

Para auditar el código periódicamente (código muerto, duplicación, arquitectura, seguridad, pruebas y documentación) se sigue la lista de `docs/auditoria.md`.

En GitHub, el flujo `.github/workflows/ci.yml` corre el lint, las pruebas con cobertura (`npm run cobertura`) y `npm run e2e` en cada pull request y en cada push a `main`. El informe de cobertura queda como artefacto de cada corrida (`cobertura`) y, si fallan las pruebas de punta a punta, también el de Playwright (`reporte-playwright`). Los navegadores de Playwright quedan en caché entre corridas. Además, `.github/dependabot.yml` hace que GitHub abra cada semana PRs con las actualizaciones de dependencias de npm y de las acciones del CI; cada uno pasa por el mismo CI antes de mergearse.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta el paquete compartido en modo observación, la API y la web. |
| `npm run dev:red` | Igual que `dev`, pero accesible desde otros dispositivos de la red local (ver "Probar desde el celular u otra compu"). |
| `npm run build` | Compila los tres paquetes. |
| `npm test` | Corre las pruebas del backend y del frontend con Vitest. |
| `npm run cobertura` | Corre las mismas pruebas y mide la cobertura; falla si baja de los mínimos de cada paquete. El informe HTML queda en `apps/*/coverage/`. |
| `npm run e2e` | Corre las pruebas de punta a punta con Playwright. |
| `npm run lint` | ESLint, verificación de formato con Prettier y chequeo de tipos. |
| `npm run format` | Aplica el formato de Prettier. |
| `npm run db:reset` | Resetea la base de desarrollo y carga la semilla. |


## Cambiar las fechas de un viaje

Desde Gestión del grupo → Datos del viaje → Editar, el Admin puede correr las fechas automáticamente o elegir qué días se conservan. Lo que no entra completo queda en Planificar → Sin día, conservando votos, estado, horarios y noches. Allí el Admin puede ubicarlo en una fecha o descartarlo con las acciones habituales. El Resumen recuerda qué falta ubicar.

Después de actualizar el código, aplicar las migraciones con `npm exec -w apps/api -- prisma migrate deploy`, sin resetear las bases.

La cuenta regresiva de la portada y de Mis grupos queda verde cuando todas las noches tienen alojamiento confirmado y no quedan propuestas pendientes ni Sin día. Si falta algo, los últimos 30 días aumentan la urgencia del amarillo suave al rojo en siete escalones (cada 15% de ese período, aproximadamente 4 o 5 días), con un detalle breve de lo que falta. Antes de esa ventana permanece neutra; durante y después del viaje conserva el contador actual.
