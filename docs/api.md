# Referencia de la API

Estado al cierre de F6. Esta referencia se actualiza en cada fase que agrega o cambia endpoints; el diseño completo está en la sección 5 de `PLAN.md`.

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

Transiciones válidas: pendiente → confirmada o denegada; confirmada → cancelada. `afectadas` lista otras propuestas que cambiaron de estado como consecuencia: al confirmar una actividad, las demás opciones pendientes de su grupo quedan denegadas.

Al confirmar una actividad se vuelve a controlar la superposición con las confirmadas; si choca, responde 409 `SUPERPOSICION_HORARIA` y no cambia nada.

## Alojamientos

| Método y ruta | Quién | Cuerpo | Respuesta | Errores específicos |
|---|---|---|---|---|
| `GET /api/viajes/:viajeId/alojamientos?estado=` | Participante | Filtro opcional por estado | `200 { alojamientos }`, ordenados por fecha de entrada | 400 si el estado no existe |
| `POST /api/viajes/:viajeId/alojamientos` | Participante | `{ nombre, descripcion, ubicacion, latitud?, longitud?, fechaDesde, fechaHasta, precio? }`; coordenadas ambas o ninguna; precio total estimado en la unidad mínima de la moneda | `201 { alojamiento }` pendiente de votación | 422 `FUERA_DEL_VIAJE` (con `detalles: { desde, hasta }`) |

Cada alojamiento es una `propuesta` con `alojamiento: { nombre, fechaDesde, fechaHasta }`.

## Actividades

| Método y ruta | Quién | Cuerpo | Respuesta | Errores específicos |
|---|---|---|---|---|
| `GET /api/viajes/:viajeId/actividades?estado=` | Participante | Filtro opcional por estado | `200 { actividades }`, ordenadas por fecha, hora de inicio y creación; las alternativas van en la misma lista | 400 si el estado no existe |
| `POST /api/viajes/:viajeId/actividades` | Participante | `{ titulo, descripcion, ubicacion, latitud, longitud, fecha, horaInicio, duracionMin, precio? }`; `horaInicio` en formato `HH:mm`; duración en minutos, de 1 a 1440; coordenadas obligatorias | `201 { actividad }` pendiente de votación | 409 `SUPERPOSICION_HORARIA`, 422 `FUERA_DEL_VIAJE` |
| `GET /api/viajes/:viajeId/actividades/:actividadId` | Participante | — | `200 { actividad }` | 404 |
| `POST /api/viajes/:viajeId/actividades/:actividadId/alternativas` | Participante | El mismo cuerpo que para proponer | `201 { actividad }`, vinculada a la original aunque se haya elegido una alternativa | 404, 409 `ORIGINAL_NO_PENDIENTE`, 409 `SUPERPOSICION_HORARIA`, 422 `FUERA_DEL_VIAJE` |

Cada actividad es una `propuesta` con `actividad: { titulo, fecha, horaInicio, horaFin, duracionMin, alternativaDe }`. `horaFin` se calcula con la duración y puede ser del día siguiente; `alternativaDe` es `{ id, titulo }` de la original, o `null` si es una original. Solo se controla que el día de inicio caiga dentro del viaje.

La superposición se controla solo contra las actividades confirmadas; los intervalos son semiabiertos, así que una actividad que empieza cuando termina otra no choca. En `SUPERPOSICION_HORARIA`, `detalles` es `{ conflictos: [{ id, titulo, fecha, horaInicio, duracionMin }] }`.

Votar, desvotar, confirmar, denegar y cancelar una actividad usan los endpoints comunes de propuestas.

## Itinerario

| Método y ruta | Quién | Parámetros | Respuesta | Errores específicos |
|---|---|---|---|---|
| `GET /api/viajes/:viajeId/cronograma` | Participante | — | `200 { dias: [{ fecha, actividades, alojamientos }] }` con todos los días del viaje | — |
| `GET /api/viajes/:viajeId/mapa?hoy=&dia=` | Participante | `hoy` obligatorio: fecha del dispositivo (`YYYY-MM-DD`); `dia` opcional, dentro del viaje | `200 { dia, diasConActividad, actividades, recorrido, aviso }` | 400 `VALIDACION`, 422 `FUERA_DEL_VIAJE` |

- **Actividades del itinerario:** solo las confirmadas, con la forma `{ id, titulo, descripcion, fecha, horaInicio, horaFin, duracionMin, ubicacion, latitud, longitud }`, ordenadas por hora de inicio y título. En el mapa, la posición en la lista es el número del marcador.
- **Alojamientos de cada día del cronograma:** `[{ id, nombre, ubicacion }]` con los alojamientos confirmados en los que se pasa esa noche. El día de salida no cuenta. La lista queda vacía si no hay ninguno.
- **Día que muestra el mapa si no se indica `dia`:** hoy, si cae dentro del viaje; si no, el primer día con actividades confirmadas; y si no hay ninguna, el primer día del viaje.
- **`recorrido`:** los puntos `{ latitud, longitud }` que unen las actividades en orden. En el MVP son líneas rectas.
- **`aviso`:** vale `"SIN_ACTIVIDADES_CONFIRMADAS"` cuando el día no tiene actividades, y `null` en otro caso.
- **Ver una actividad en el mapa (CU18):** se usa `GET …/actividades/:actividadId` para conocer su día y después se pide el mapa de ese día.

## Chat

| Método y ruta | Quién | Parámetros | Respuesta | Errores específicos |
|---|---|---|---|---|
| `GET /api/viajes/:viajeId/mensajes?antesDe=&limite=` | Participante | `limite` de 1 a 100 (por defecto 50); `antesDe`, id del mensaje más viejo que ya se tiene | `200 { mensajes, hayMas }`, con los mensajes en orden cronológico | 400 `VALIDACION`, 404 si `antesDe` no es un mensaje del viaje |

Cada mensaje es `{ id, viajeId, autor: { id, nombre, apodo }, contenido, enviadoEn }`. La paginación usa `(enviadoEn, id)` como cursor, así dos mensajes del mismo instante no se repiten ni se pierden.

### Socket.IO

Espacio de nombres `/chat`, **solo con transporte WebSocket**. El handshake exige el encabezado `Origin` de la aplicación y la cookie de sesión, y los rechaza con `ORIGEN_NO_PERMITIDO` o `NO_AUTENTICADO` en el error de conexión. Además, cada evento vuelve a validar la sesión: si se cerró o venció, responde `NO_AUTENTICADO` y corta la conexión.

| Evento | Sentido | Carga | Confirmación y reglas |
|---|---|---|---|
| `chat:unirse` | cliente → servidor | `{ viajeId }` | `{ ok: true }`, o `{ ok: false, error: { codigo: "NO_PARTICIPANTE" } }` si no tiene membresía activa |
| `chat:salir` | cliente → servidor | `{ viajeId }` | `{ ok: true }` |
| `chat:enviar` | cliente → servidor | `{ viajeId, contenido, idTemporal }`; contenido de 1 a 2000 caracteres, sin contar los espacios de los extremos | `{ ok: true, mensaje }`, o `{ ok: false, error }` con `VALIDACION` o `NO_PARTICIPANTE` |
| `chat:mensaje` | servidor → sala del viaje | el mensaje con el `idTemporal` de quien lo envió | Llega a todos los que están en la sala, incluido quien lo envió |
| `viaje:membresia-finalizada` | servidor → conexiones del usuario | `{ viajeId, motivo: "ELIMINADO" \| "RETIRADO", conservaAccesoSaldos }` | Se emite tras una baja; el servidor saca esas conexiones de la sala. `conservaAccesoSaldos` es verdadero si tiene saldos pendientes a favor o en contra |
| `viaje:admin-cambiado` | servidor → sala del viaje | `{ viajeId, nuevoAdminId, anteriorAdminId }` | Se emite tras un traspaso |
