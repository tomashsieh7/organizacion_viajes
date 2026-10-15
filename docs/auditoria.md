# Lista de auditoría del código

Esta lista sirve para auditar el proyecto varias veces con el mismo criterio, así los resultados de cada pasada se pueden comparar con los de la anterior. Cubre código muerto, duplicación, arquitectura, diseño, correctitud, seguridad, pruebas, rendimiento, dependencias, frontend, documentación y CI. Las reglas de referencia son las de `CLAUDE.md` y las secciones 2.2 a 2.4 de `PLAN.md`.

## Cómo usarla

- **Orden:** las secciones se recorren en orden, y la sección 1 va siempre primero.
- **Prioridad de cada hallazgo:**
  - alta: rompe algo o expone datos;
  - media: puede dar resultados incorrectos;
  - baja: deuda técnica;
  - sin cambio: se deja como está, con el motivo.
- **Registro:** la pasada se anota en `LOG.md` con la plantilla de la sección 14.
- **Cambios estructurales:** siguen el flujo de `CLAUDE.md`, con plan y aprobación previa.
- **Frecuencia:**
  - la sección 1 corre en cada pull request, porque ya la hace el CI;
  - la lista completa se recorre antes de cada entrega, al cerrar cada release y después de cambios grandes.

## 1. Base automática

| Comando | Qué mirar |
|---|---|
| `npm run lint`, `npm test`, `npm run e2e` | Todo en verde. Las pruebas necesitan `docker compose up -d`. |
| `npm audit` y `npm audit --omit=dev` | Advertencias nuevas desde la pasada anterior. Las conocidas están registradas en `LOG.md`. |
| `npm outdated` | Versiones mayores pendientes. |
| `npx knip` | Archivos, exportaciones y dependencias sin uso. Los resultados se verifican a mano antes de borrar nada. |
| `npx jscpd apps packages e2e --ignore "**/generado/**,**/node_modules/**,**/dist/**" --reporters console` | Bloques copiados. Comparar la cantidad de clones con la pasada anterior. |
| `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` | Corre desde `apps/api` con `DATABASE_URL` apuntando a `viajes_test` y después de `npm test`, que aplica las migraciones. Tiene que decir "No difference detected". |

`npm run e2e` incluye `e2e/accesibilidad.spec.ts`, que pasa axe con las reglas WCAG 2.2 A y AA por las pantallas principales. Si falla, el mensaje dice la pantalla, el modo, el ancho y la regla.

**Falsos positivos conocidos de `knip`:**
- `e2e/soporte/prepararBase.ts`: lo ejecuta `prepararTodo.ts` con `tsx`.
- `@prisma/client`: lo usa el cliente generado en `src/generado`.
- `pg` y `@types/pg`: los necesitan `@prisma/adapter-pg` y `prepararBase.ts`.

La cobertura se mide con `npm run cobertura` (necesita la base de prueba, como `npm test`), que falla si baja de los mínimos fijados en `apps/api/vitest.config.ts` y `apps/web/vite.config.ts`. Se anota el resumen de cada paquete, se comparan los archivos con menos cobertura contra la pasada anterior y, si la medición subió bastante, se suben los mínimos. El detalle queda en `apps/api/coverage/` y `apps/web/coverage/`.

## 2. Código muerto

- Archivos, componentes Vue, stores, composables y utilidades que no se importan desde ningún lado.
- Métodos de puertos y repositorios que ningún caso de uso llama.
- Parámetros y campos que nunca se leen.
- Ramas que no se pueden alcanzar.
- Códigos de error que se definen y nunca se lanzan, o que el frontend no distingue.
- Esquemas de `packages/compartido` sin uso.
- Variables de `.env.example` que `apps/api/src/config.ts` no lee, y scripts de `package.json` que nadie usa.
- Comentarios que citan fases ya cerradas o decisiones reemplazadas (por ejemplo, "F4 agrega…").

## 3. Duplicación

- **Reglas de negocio** repetidas entre el dominio y las consultas de infraestructura. Ejemplos: la membresía `ACTIVA` y los saldos pendientes de RN-E6, hoy en `saldosPendientesDe`.
- **Validaciones** repetidas entre los esquemas Zod de `packages/compartido` y el dominio. Si la repetición es intencional, porque una protege la API y la otra el modelo, se documenta.
- **Constantes y mensajes:** expresiones regulares (`esUuid`), constantes y mensajes de error copiados.
- **Presentación:** formato de montos, fechas o nombres repetido entre vistas, que debería vivir en `apps/web/src/utiles/`.

## 4. Arquitectura y capas (PLAN 2.3)

**Dominio.** No importa infraestructura, casos de uso, rutas, Express, Prisma ni Socket.IO:

```bash
grep -rn "from '" apps/api/src/modulos/*/dominio apps/api/src/compartido/valores \
  | grep -E "infraestructura|casos-de-uso|rutas|express|prisma|socket"
```

**Casos de uso.** No importan infraestructura ni el cliente generado:

```bash
grep -rn "from '" apps/api/src/modulos/*/casos-de-uso | grep -E "infraestructura|express|generado|socket"
```

**Otras reglas:**
- **Dependencias entre módulos:** solo las previstas, como actividades y alojamientos sobre `Propuesta`. Se revisan los `../../<módulo>/` de cada capa.
- **Prisma:** se usa solo en `infraestructura/`, en `contenedor.ts`, en la semilla y en las pruebas.
- **Implementaciones concretas:** se instancian solo en `apps/api/src/contenedor.ts` y en `apps/web/src/main.ts`.
- **Rutas:** sin lógica de negocio. Validan, llaman al caso de uso y arman la respuesta.
- **Frontend:**
  - las vistas no llaman a `fetch`;
  - los clientes de API se inyectan en `main.ts`;
  - los componentes de presentación reciben props y emiten eventos, salvo las excepciones documentadas en el PLAN (`CampoUbicacion`, `CronogramaVista`, `useMapaDelDia`).

## 5. Diseño (`CLAUDE.md`, secciones 3 a 5, y PLAN 2.2)

- Interfaces con una sola implementación que no cumplen ninguna de las condiciones de PLAN 2.2.4: aislar una dependencia externa, cubrir una variación actual o permitir probar sin infraestructura.
- Genéricos con una sola instanciación real.
- Patrones que no figuran en PLAN 2.2.3 ni en `LOG.md`.
- Abstracciones que anticipan releases futuros.
- Anti-patrones de la sección 4 de `CLAUDE.md`:
  - **God Class:** revisar los archivos de más de unas 250 líneas, que hoy son `contenedor.ts` y `viajes/dominio/viaje.ts`;
  - **interfaces demasiado grandes:** conviene un `Pick<…>` o partirlas;
  - **violaciones de LSP;**
  - **acoplamiento alto y dependencias sobre implementaciones concretas.**
- Responsabilidad única: cada caso de uso es una clase propia, sin servicios que acumulen operaciones.

## 6. Correctitud y concurrencia

- **Decisiones fuera de la transacción:** lecturas que deciden algo antes de abrirla. Buscar `obtener(` en `casos-de-uso/` fuera de `unidad.ejecutar`. Es el error que corrigió el PR #6 en gastos y pagos.
- **Bloqueos:** se toman siempre en el mismo orden (viaje, después propuestas, después deudas), con `FOR UPDATE` o `FOR SHARE` donde D18 lo exige.
- **Efectos después de confirmar:** eventos y notificaciones nunca hacen fallar una respuesta que ya quedó guardada.
- **Dinero:** enteros en la unidad mínima, con el reparto del resto de D16 y nunca `number` decimal.
- **Fechas:** `Fecha` como texto ISO, "hoy" según el dispositivo, y cuidado con los límites de día y las zonas horarias.
- **Errores genéricos:** cada `throw new Error` llega al cliente como 500. Hay que confirmar que es un caso de verdad imposible.
- **Resultados nulos:** los `null` que devuelven repositorios y consultas se tratan siempre.

## 7. Seguridad

- **Guardas de acceso:**
  - cada ruta tiene la que le corresponde: `autenticado`, `participanteActivo`, `soloAdmin` o `accesoSaldos`;
  - cada endpoint se prueba sin sesión, desde otro viaje y como exparticipante.
- **Acceso por identificadores ajenos:** toda consulta por id filtra también por `viajeId`.
- **Validación de entradas:** Zod valida cada cuerpo, cada consulta y cada evento de Socket.IO.
- **SQL:** las consultas crudas usan plantillas etiquetadas (`$queryRaw`), y `grep -rn queryRawUnsafe apps/api/src --exclude-dir=generado` no devuelve nada.
- **Cookies y origen:**
  - la cookie de sesión es `httpOnly` y `sameSite`, y también `secure` en producción;
  - `verificarOrigen` y el handshake de Socket.IO exigen el `Origin` de la aplicación.
- **Abuso:** el límite de registros por hora sigue activo.
- **Credenciales:** los parámetros de argon2 y el hash ficticio de RN-S3 siguen vigentes.
- **Secretos y logs:** no hay secretos en el repo, y `console.error` no imprime datos personales ni tokens.
- **Tiempo real:** Socket.IO revalida la sesión en cada evento.

## 8. Pruebas

- **Trazabilidad:** `apps/api/test/unitarias/trazabilidad.test.ts` sigue pasando, y cada RN y cada CU nuevos del PLAN tienen su prueba.
- **Pruebas que nunca fallan:** romper a propósito una regla o un bloqueo y confirmar que su prueba falla. Así se verificó D18 en el PR #6.
- **Filtros olvidados:** no quedan `.only` ni `.skip`. Se buscan con `grep -rnE "\.(only|skip)\(" apps e2e --include=*.ts`.
- **Dobles en memoria:** se comportan igual que Prisma, según las pruebas de contrato de `apps/api/test/contratos/`.
- **Concurrencia:** hay pruebas de concurrencia donde D18 lo exige.
- **Pruebas intermitentes:** las de punta a punta cubren los flujos principales y se corren varias veces para descartar fallas intermitentes.

## 9. Rendimiento

- **Consultas en bucle (N+1):** `await` dentro de bucles que hacen consultas.
- **Índices:** los de `apps/api/prisma/schema.prisma` acompañan a los `where` y `orderBy` frecuentes.
- **Paginación:** listados que pueden crecer sin límite.
- **Bundle web:** el tamaño que informa `npm run build -w apps/web`, comparado con la pasada anterior.

## 10. Dependencias y configuración

- Dependencias sin uso o duplicadas: `npx knip` y `npm ls --all | grep deduped`.
- Las migraciones coinciden con el schema (sección 1).
- La semilla cumple sus invariantes, según `invarianteSemilla.bd.test.ts`.
- `tsconfig.base.json` mantiene `strict`.
- Las versiones de Node, PostgreSQL y las acciones de GitHub coinciden entre el README, `docker-compose.yml` y `.github/workflows/ci.yml`.

## 11. Frontend y accesibilidad

- **Estados de cada vista:** carga, error (con `mensajeDeError`) y lista vacía.
- **Formularios:** tienen etiquetas, con `CampoFormulario`.
- **Diálogos:** manejan el foco y se pueden usar con teclado.
- **Contraste y pantallas chicas:**
  - los colores de `App.vue` cumplen el contraste AA (4,5:1) contra los fondos donde se usan;
  - `e2e/diseno.spec.ts` verifica que ninguna página del viaje se desborde a 360 px de ancho;
  - en cada pasada conviene sacar capturas en celular y en escritorio con un spec temporal de Playwright, para mirar lo que las pruebas no ven.
- **Textos:** español rioplatense consistente en toda la interfaz.
- **Consola:** sin advertencias ni errores durante las pruebas de punta a punta.

## 12. Documentación y diagramas

**PLAN contra código.** Los nombres en código que cita `PLAN.md` y no existen se listan con este script, desde la raíz. Después se descartan a mano los enumerados y los términos de SQL:

```bash
for n in $(grep -oE '`[A-Z][A-Za-z]+`' PLAN.md | tr -d '`' | sort -u); do
  grep -rqE "(class|interface|type|function|const) $n\b" apps packages --include=*.ts \
    --exclude-dir=node_modules --exclude-dir=generado \
    || [ -n "$(find apps/web/src -name "$n.vue")" ] || echo "$n"
done
```

**Otras comprobaciones:**
- Las reglas RN de `PLAN.md` coinciden con el código que las cita.
- `docs/api.md` coincide con las rutas reales de cada `*.rutas.ts`.
- `README.md` coincide con los scripts de `package.json`.
- **Diagramas:**
  - el diagrama conceptual de `docs/diagramas.drawio` coincide con `schema.prisma` en entidades, atributos y multiplicidades;
  - los diagramas de actividad coinciden con las reglas implementadas;
  - las diferencias se resuelven según la sección 2 de `CLAUDE.md`.
- `LOG.md` es solo de agregado y tiene una entrada por acción.

## 13. CI y repositorio

- `.github/workflows/ci.yml` corre lo mismo que se corre localmente, con acciones de versiones vigentes.
- La rama por defecto en GitHub es `main`, y no quedan ramas viejas sin motivo.
- `.gitignore` cubre los artefactos locales: `playwright-report/`, `test-results/`, `.env`.
- Las corridas fallidas suben su informe como artefacto.
- Los PRs de Dependabot que quedaron abiertos se revisan y se mergean o se cierran con un motivo.

## 14. Plantilla de registro en `LOG.md`

```markdown
## AAAA-MM-DD HH:MM — Auditoría de código

- **Revisado:** sha `xxxxxxx`, secciones 1 a 13 de `docs/auditoria.md`.
- **Base automática:** resultado de cada comando de la sección 1 y diferencias con la pasada anterior.
- **Hallazgos:** uno por línea, con su prioridad (alta, media, baja o sin cambio) y el archivo.
- **Corregido:** qué se corrigió y en qué PR.
- **Sin cambio:** qué se decidió no tocar y por qué.
- **Pendiente para el usuario:** decisiones que le corresponden.
```
