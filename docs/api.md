# Referencia de la API

Estado al cierre de F3. Esta referencia se actualiza en cada fase que agrega o cambia endpoints; el diseño completo está en la sección 5 de `PLAN.md`.

## Convenciones

- Todas las rutas cuelgan de `/api`. Cuerpos y respuestas en JSON.
- Montos: enteros en la unidad mínima de la moneda del viaje (centavos para pesos). Fechas `YYYY-MM-DD`.
- **Sesión:** cookie `sesion` (`httpOnly`, `SameSite=Lax`, `Secure` en producción), que se crea al registrarse o iniciar sesión y dura 7 días (`SESION_DIAS`).
- **Origen:** toda petición que no sea `GET`, `HEAD` u `OPTIONS` tiene que traer el encabezado `Origin` igual a `ORIGEN_WEB` (por defecto `http://localhost:5173`); si no, responde 403 `ORIGEN_NO_PERMITIDO`.
- **Errores:** siempre con la forma `{ "error": { "codigo", "mensaje", "detalles" } }`. En los errores de validación, `detalles` es una lista `[{ "campo", "mensaje" }]`.

| HTTP | Código | Cuándo |
|---|---|---|
| 400 | `VALIDACION` | El cuerpo no cumple el esquema. |
| 401 | `NO_AUTENTICADO` | No hay sesión, venció o fue revocada. |
| 403 | `ORIGEN_NO_PERMITIDO` | El `Origin` no es el de la aplicación. |
| 403 | `NO_PARTICIPANTE` | Quien llama no participa del viaje. |
| 403 | `SOLO_ADMIN` | La acción es del Admin del viaje. |
| 404 | `NO_ENCONTRADO` | El recurso no existe o el identificador no es válido. |
| 429 | `DEMASIADOS_INTENTOS` | Se superó un límite de intentos. |
| 500 | `ERROR_INTERNO` | Error inesperado (sin detalles). |

## Salud

| Método y ruta | Respuesta |
|---|---|
| `GET /api/salud` | `200 { "ok": true }` |

## Autenticación

| Método y ruta | Cuerpo | Respuesta | Errores específicos |
|---|---|---|---|
| `POST /api/auth/registro` | `{ email, password, nombre, apodo? }`; contraseña de 8 a 128 caracteres | `201 { usuario }` y cookie de sesión | 400 `CONTRASENA_COMUN`, 409 `EMAIL_EN_USO`, 429 (10 registros por hora por IP) |
| `POST /api/auth/sesion` | `{ email, password }` | `200 { usuario }` y cookie de sesión | 401 `CREDENCIALES_INVALIDAS` (mismo mensaje exista o no el email), 429 tras 5 intentos fallidos por email o por IP en 15 minutos |
| `DELETE /api/auth/sesion` | — | `204` y borra la cookie; la sesión queda revocada | — |
| `GET /api/auth/yo` | — | `200 { usuario }` | 401 |

`usuario` es `{ id, nombre, apodo }`.

## Grupo de viaje

Todas requieren sesión. Las rutas bajo `/api/viajes/:viajeId` requieren además participar del viaje.

| Método y ruta | Quién | Cuerpo | Respuesta | Errores específicos |
|---|---|---|---|---|
| `GET /api/monedas` | Con sesión | — | `200 { monedas: [{ codigo, nombre, decimales }] }` | — |
| `POST /api/viajes` | Con sesión (queda como Admin) | `{ nombre, destino, fechaInicio, fechaFin, monedaCodigo }` | `201 { viaje }` (detalle) | 400 si `fechaInicio > fechaFin`, 422 `MONEDA_INEXISTENTE` |
| `GET /api/viajes` | Con sesión | — | `200 { viajes: [{ id, nombre, destino, fechaInicio, fechaFin, monedaCodigo, miRol }] }` | — |
| `GET /api/viajes/:viajeId` | Participante | — | `200 { viaje: { id, nombre, destino, fechaInicio, fechaFin, moneda, miRol, miDeudaPendiente, cantidadParticipantes } }` | — |
| `GET /api/viajes/:viajeId/participantes` | Participante | — | `200 { participantes: [{ usuarioId, nombre, apodo, rol }] }`, Admin primero | — |
| `POST /api/viajes/:viajeId/participantes` | Admin | `{ email }` de un usuario registrado | `201 { participante }`; si se había ido, reactiva su membresía | 404 `USUARIO_NO_REGISTRADO`, 409 `YA_ES_PARTICIPANTE` |
| `DELETE /api/viajes/:viajeId/participantes/:usuarioId` | Admin | — | `200 { bajaConDeuda }`; baja lógica que conserva el historial y retira sus votos en propuestas pendientes | 404, 409 `NO_PUEDE_ELIMINARSE_A_SI_MISMO` |
| `POST /api/viajes/:viajeId/salir` | Participante | `{ nuevoAdminId? }`, obligatorio si quien sale es el Admin | `200 { bajaConDeuda }` | 400 `FALTA_SUCESOR`, 409 `ADMIN_UNICO_PARTICIPANTE`, 422 `SUCESOR_INVALIDO` |
| `POST /api/viajes/:viajeId/administracion/traspaso` | Admin | `{ nuevoAdminId }` | `204` | 422 `SUCESOR_INVALIDO` |

## Propuestas (comunes a alojamientos y actividades)

Requieren participar del viaje. `propuesta` es la vista común: `{ id, tipo, estado, descripcion, precio, ubicacion, latitud, longitud, autor: { usuarioId, nombre }, votosAFavor, votosEnContra, miVoto, creadaEn, resueltaEn }`.

| Método y ruta | Quién | Cuerpo | Respuesta | Errores específicos |
|---|---|---|---|---|
| `PUT /api/viajes/:viajeId/propuestas/:propuestaId/voto` | Participante (también quien propuso) | `{ valor: "A_FAVOR" \| "EN_CONTRA" }`; votar de nuevo reemplaza el voto | `200 { propuesta }` | 409 `PROPUESTA_NO_PENDIENTE` |
| `DELETE /api/viajes/:viajeId/propuestas/:propuestaId/voto` | Quien votó | — | `200 { propuesta }` | 404 `SIN_VOTO`, 409 `PROPUESTA_NO_PENDIENTE` |
| `POST /api/viajes/:viajeId/propuestas/:propuestaId/confirmar` | Admin | — | `200 { propuesta, afectadas }` | 409 `TRANSICION_INVALIDA` |
| `POST /api/viajes/:viajeId/propuestas/:propuestaId/denegar` | Admin | — | `200 { propuesta, afectadas }` | 409 `TRANSICION_INVALIDA` |
| `POST /api/viajes/:viajeId/propuestas/:propuestaId/cancelar` | Admin | — | `200 { propuesta, afectadas }` | 409 `TRANSICION_INVALIDA` |

Transiciones válidas: pendiente → confirmada o denegada; confirmada → cancelada. `afectadas` lista otras propuestas que cambiaron de estado como consecuencia (se usa desde F4).

## Alojamientos

| Método y ruta | Quién | Cuerpo | Respuesta | Errores específicos |
|---|---|---|---|---|
| `GET /api/viajes/:viajeId/alojamientos?estado=` | Participante | Filtro opcional por estado | `200 { alojamientos }`, ordenados por fecha de entrada | 400 si el estado no existe |
| `POST /api/viajes/:viajeId/alojamientos` | Participante | `{ nombre, descripcion, ubicacion, latitud?, longitud?, fechaDesde, fechaHasta, precio? }`; coordenadas ambas o ninguna; precio total estimado en la unidad mínima de la moneda | `201 { alojamiento }` pendiente de votación | 422 `FUERA_DEL_VIAJE` (con `detalles: { desde, hasta }`) |

Cada alojamiento es una `propuesta` con `alojamiento: { nombre, fechaDesde, fechaHasta }`.
