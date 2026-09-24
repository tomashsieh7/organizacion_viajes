# Registro de trabajo

Cada entrada indica fecha y hora (America/Argentina/Buenos_Aires), la acción realizada, los archivos creados o modificados y la decisión tomada con su motivo y las alternativas descartadas. Las entradas se agregan en orden cronológico y no se reescriben.

---

## 2026-09-23 22:30 — Inicio de la planificación del MVP

- **Acción:** se crea este registro antes de leer los diagramas, como primer paso de la pasada de planificación.
- **Archivos:** se crea `LOG.md`.
- **Decisión:** la pasada se limita a planificar; no se escribe código de la aplicación, no se instalan dependencias y no se hacen commits ni push.
- **Contexto previo:** el repositorio estaba vacío y `docs/diagramas.drawio` no existía. Se consultó al usuario, que decidió usar como fuente el XML adjunto a la conversación (`tp_Arq_Web.drawio_1.xml`) copiándolo a `docs/diagramas.drawio`, y trabajar fuera del modo de planificación de la herramienta para poder escribir `LOG.md` y `PLAN.md` en el repo. Se descartaron leer el adjunto sin copiarlo (el repo quedaría sin la fuente del diseño) y esperar a que el usuario agregara el archivo.

## 2026-09-23 22:33 — Incorporación de los diagramas y lectura completa

- **Acción:** se copió el XML adjunto a `docs/diagramas.drawio` sin modificar su contenido y se leyeron sus 11 páginas (casos de uso, seis diagramas de actividad, diagrama conceptual y tres versiones del story mapping).
- **Archivos:** se crea `docs/diagramas.drawio`.
- **Decisión:** la extracción se hizo con scripts de Python descartables guardados en el directorio temporal de la sesión, fuera del repo, que recorren el XML y listan nodos, aristas, etiquetas de cardinalidad y posiciones. Se descartó convertir el archivo a otro formato dentro del repo porque el diagrama sigue siendo la fuente de verdad y una copia derivada quedaría desactualizada.
- **Hallazgos relevantes para el plan:** el modelo conceptual no tiene relación de pertenencia entre Viajero y Viaje, ni vínculo entre una alternativa y su actividad original, ni hora de inicio o coordenadas en Actividad; la cardinalidad Gasto 1 — 0..* Deuda choca con una deuda acumulada por par de viajeros; las tres versiones del story mapping difieren en alcance y releases. Estos puntos se registran como preguntas abiertas en `PLAN.md`.

## 2026-09-23 22:33 — Esqueleto de PLAN.md

- **Acción:** se crea `PLAN.md` con los títulos de las diez secciones pedidas, para completarlas una por una.
- **Archivos:** se crea `PLAN.md`.
- **Decisión:** el orden de las secciones sigue el pedido del usuario. Las preguntas abiertas se numeran (P1, P2, …) y el resto del plan las referencia donde una decisión pendiente afecta un endpoint, una tabla o una fase, de modo que se pueda ubicar el impacto de cada respuesta.

## 2026-09-23 22:35 — Secciones 1 a 3 de PLAN.md

- **Acción:** se completaron la tabla de trazabilidad (23 historias del MVP), la arquitectura con la estructura de carpetas y las decisiones técnicas D1 a D18.
- **Archivos:** se modifica `PLAN.md`.
- **Decisiones principales:** TypeScript en todo el proyecto con un monorepo de workspaces de npm; PostgreSQL con Prisma; sesión en cookie `httpOnly` con JWT; Socket.IO para el chat; Leaflet con OpenStreetMap y un recorrido trazado como polilínea en orden cronológico; Zod compartido entre front y back; Pinia; Vitest, Supertest y Playwright; montos en centavos enteros. Cada decisión tiene su alternativa descartada en la tabla de la sección 3. Se eligió una polilínea para el recorrido porque el Release 4 ya planifica rutas y tiempos reales, y se descartó integrar OpenRouteService u OSRM en el MVP por requerir clave o un servidor sin garantías.
- **Pendiente:** el registro y el inicio de sesión no aparecen en los diagramas; se incluyen como soporte transversal en F2 y quedan sujetos a la pregunta P3.

## 2026-09-23 22:37 — Secciones 4 a 6 de PLAN.md

- **Acción:** se completaron el modelo de datos (DER en Mermaid, restricciones y justificación de los mapeos), la API con los eventos de Socket.IO y las reglas de negocio de los seis diagramas de actividad más las que surgen de los casos de uso.
- **Archivos:** se modifica `PLAN.md`.
- **Decisiones:** Admin se mapea como rol por viaje en `membresia` y no como tabla aparte, porque una persona puede ser Admin de un viaje y viajero común en otro; se descartaron una tabla `admin` y una columna `es_admin` en `usuario`. Propuesta se mapea con tabla base más una tabla por subclase, descartando la tabla única con columnas nulas y dos tablas sin base común. Los votos van en una tabla con `valor` y clave `(propuesta_id, usuario_id)`, descartando dos tablas de relación. La deuda se guarda acumulada por par deudor–acreedor con partes de gasto en `gasto_parte` y pagos que restan; se descartó calcularla siempre desde el historial porque el conceptual la trata como entidad. Votos, confirmación, denegación y cancelación se unifican en rutas `…/propuestas/:propuestaId/…` compartidas por alojamientos y actividades.
- **Pendiente:** los agregados al modelo conceptual (membresía, credenciales, hora de inicio, coordenadas, nombre de alojamiento, vínculo de alternativas, partes de gasto) quedan sujetos a las preguntas P2, P3, P8, P9 y P14.

## 2026-09-23 22:39 — Secciones 7 a 10 de PLAN.md

- **Acción:** se completaron las pantallas Vue con sus rutas, componentes y stores; las diez fases de implementación (F0 a F9) con objetivo, entregables, dependencias y criterio de terminado; las extensiones futuras de los releases 2 a 10 y las 22 preguntas abiertas (P1 a P22).
- **Archivos:** se modifica `PLAN.md`.
- **Decisiones:** las fases de chat (F6) y de gastos (F7) dependen solo de la gestión del grupo (F2), para poder hacerlas en paralelo con propuestas e itinerario. Votos y transiciones se implementan una vez en F3 y F4 los reutiliza. Se dejó escrito en la sección 8.1 que el registro en `LOG.md` es obligatorio en todas las fases posteriores y que una fase no empieza con preguntas pendientes que la afecten. Cada pregunta abierta trae una opción propuesta que el plan usa de forma provisional, sin darla por aprobada.

## 2026-09-23 22:39 — Revisión de coherencia

- **Acción:** se cruzaron las secciones del plan con los criterios de éxito.
- **Archivos:** ninguno nuevo; `PLAN.md` sin cambios en esta revisión.
- **Resultado:** las 23 historias del MVP de "Página-13" tienen endpoint, pantalla y fase; las diez fases tienen criterio de terminado verificable con comandos o pruebas; las decisiones D1 a D18 tienen justificación y alternativa descartada; las reglas de los seis diagramas de actividad (RN-A, RN-B, RN-M, RN-G, RN-P, RN-E) están ubicadas en un endpoint o servicio; todas las referencias P1 a P22 del plan apuntan a una pregunta definida en la sección 10 y ninguna quedó resuelta sin decisión del usuario.
- **Estado:** no se escribió código, no se instalaron dependencias y no se hicieron commits ni push. Se espera la aprobación del usuario.

## 2026-09-23 23:32 — Revisión de las preguntas abiertas con el usuario

- **Acción:** se recorrieron con el usuario, una por una, las preguntas P1 a P22 de la sección 10 de `PLAN.md`. Las entradas siguientes registran cada respuesta. Las decisiones se tomaron en la conversación; esta entrada y las siguientes se escriben al volcarlas al plan.
- **Archivos:** ninguno en esta entrada.

## 2026-09-23 23:32 — P1: nombres "grupo" y "viaje"

- **Decisión:** `viaje` en código, base de datos y API; "grupo de viaje" en los textos de la interfaz; los nombres de "Página-13" son la referencia para las historias.
- **Descartado:** usar `grupo` en todos lados, porque se apartaría del nombre de la clase del diagrama conceptual.

## 2026-09-23 23:32 — P2: pertenencia al viaje y rol de Admin

- **Decisión:** tabla `membresia` con `rol` y `estado` por viaje y un único Admin activo, que es quien crea el viaje; `viaje.creado_por_id` conserva la relación "crea".
- **Descartado:** tabla `admin` separada o columna `es_admin` en `usuario`, porque fijan el rol a la persona y no al viaje, y no resuelven quién pertenece a cada viaje.

## 2026-09-23 23:32 — P3: registro, inicio de sesión y seguridad

- **Decisión:** email y contraseña sin envío de correos. Por pedido del usuario de reforzar la seguridad, se cambió D5: hash con argon2id (`@node-rs/argon2`) y sesiones guardadas en la base con token aleatorio de 256 bits, del que solo se guarda el hash. Se sumaron las medidas de D6: contraseña de 8 a 128 caracteres (el usuario pidió 8 como mínimo en lugar de los 12 propuestos) con rechazo de contraseñas comunes, email normalizado, mismo mensaje y tiempo en ingresos fallidos, límite de 5 intentos por email o IP cada 15 minutos, verificación de `Origin`, `helmet`, CORS cerrado y secretos fuera del repo. A pedido del usuario, la identidad (`usuario`) se separó de las formas de ingresar (`credencial`), con la interfaz `ProveedorAutenticacion`, para sumar otras formas de autenticación en el futuro (D7).
- **Descartado:** registro por número de teléfono (el usuario lo consideró y eligió email para el MVP; con verificación por SMS requeriría un proveedor pago); nombre de usuario en lugar de email; ingreso con Google u otro proveedor; JWT en cookie, porque no se puede revocar antes de su vencimiento; `bcryptjs`, porque argon2id es la recomendación actual; mínimo de 12 caracteres, por decisión del usuario.

## 2026-09-23 23:32 — P4: agregar viajeros

- **Decisión:** el Admin escribe el email de un usuario registrado, con error si no existe o si ya es participante.
- **Descartado:** enlace de invitación, porque requiere tokens con vencimiento y una pantalla de aceptación; invitación pendiente de aceptación, porque agrega un estado sin que ningún diagrama lo pida.

## 2026-09-23 23:32 — P5: salida del Admin

- **Decisión:** traspaso elegido. Se agrega CU24 "Admin transfiere la administración", disponible en cualquier momento con su propio endpoint y obligatorio para que el Admin salga, todo en una transacción. Si el Admin es el único participante, no puede salir.
- **Descartado:** que el Admin no pueda salir nunca; traspaso automático al participante más antiguo, porque el grupo terminaría con un Admin que no eligió; cerrar el viaje al salir el Admin, porque deja trabado al resto; borrar el viaje cuando queda un solo participante, porque no está en ningún diagrama.

## 2026-09-23 23:32 — P6: desvotar

- **Decisión:** se incluyen en el MVP desvotar alojamiento (CU25) y desvotar actividad (CU26), solo sobre propuestas pendientes y solo el voto propio.
- **Descartado:** dejarlos fuera por no estar en el story mapping; permitir desvotar propuestas ya resueltas, porque cambiaría algo que el Admin ya decidió.

## 2026-09-23 23:32 — P7: estados de propuesta y resolución

- **Decisión:** estados `PENDIENTE`, `CONFIRMADA`, `DENEGADA` y `CANCELADA`; denegar rechaza una pendiente y cancelar anula una confirmada; denegada y cancelada son finales; el Admin confirma libremente viendo el conteo de votos; quien propone puede votar lo suyo.
- **Descartado:** exigir mayoría de votos para confirmar, porque habría que definir la base de la mayoría y los empates sin que los diagramas lo pidan.

## 2026-09-23 23:32 — P8: atributos faltantes en el conceptual

- **Decisión:** `hora_inicio` y duración en minutos en actividad; `latitud` y `longitud` en propuesta, obligatorias en actividades y opcionales en alojamientos, además del texto de ubicación; `nombre` en alojamiento; `precio` como total estimado, opcional e informativo.
- **Descartado:** precio por persona, y precio que genere gastos automáticamente.

## 2026-09-23 23:32 — P9: alternativas de actividad

- **Decisión:** vínculo con `alternativa_de_id`; sin cadenas (toda alternativa apunta a la original); solo sobre actividades pendientes; mismo control de superposición que al proponer; al confirmar una opción las demás pasan a denegadas, y denegar la original no afecta a las alternativas. El usuario expresó una reserva sobre esta última regla por los subgrupos del Release 3, así que se aísla en la interfaz `PoliticaResolucionOpciones`.
- **Descartado:** árboles de alternativas; alternativas sobre actividades resueltas; alternativas sin control de superposición.

## 2026-09-23 23:32 — SOLID obligatorio

- **Decisión:** a partir de la pregunta del usuario sobre si aislar la regla de P9 en una función cumplía el principio abierto/cerrado (no lo cumplía, porque habría que editar la función), el usuario estableció que los principios SOLID se cumplen estrictamente en todo el código. La única excepción es un patrón de diseño que relaje algún principio, caso en el que prevalece el patrón y se registra en `LOG.md` con el patrón, el principio relajado y el motivo. La interpretación aprobada es la siguiente: casos de uso separados; repositorios detrás de interfaces; `UnidadDeTrabajo` para las transacciones; estrategias para las reglas con variación prevista (`PoliticaResolucionOpciones`, `PoliticaSuperposicion`, `ProveedorRecorrido`, `ProveedorAutenticacion`, `BuscadorUbicaciones`, `EstrategiaDivision`); pruebas de contrato por interfaz; y un único punto de composición (`contenedor.ts`). Como consecuencia se agregaron D14 (inyección de dependencias manual) y se reescribieron las secciones 2 y 3 de `PLAN.md`.
- **Descartado:** encapsular la regla en una función sin interfaz, porque obliga a modificarla para extenderla; un contenedor de inyección como InversifyJS o tsyringe, por los decoradores y metadatos que agrega.

## 2026-09-23 23:32 — P10: superposición al confirmar

- **Decisión:** se vuelve a controlar la superposición al confirmar una actividad, con la misma `PoliticaSuperposicion` y dentro de la transacción de confirmación.
- **Descartado:** no controlar, porque permitiría dos actividades confirmadas a la misma hora; avisar y dejar confirmar igual, porque el mapa trazaría un recorrido inconsistente.

## 2026-09-23 23:32 — P11: fechas dentro del viaje

- **Decisión:** la fecha de inicio de cada actividad y la entrada y salida de cada alojamiento deben caer dentro del viaje; los selectores de fecha solo ofrecen días del viaje; editar las fechas del viaje queda como extensión futura.
- **Descartado:** no controlar, porque dejaría propuestas invisibles en el cronograma y el mapa.

## 2026-09-23 23:32 — P12: pagador y deudores

- **Decisión:** un único pagador por gasto, por defecto quien lo anota y con opción de elegir a otro participante; el gasto se divide entre quienes tienen que pagar; la parte del pagador no genera deuda; si pagaron dos personas, se anotan dos gastos.
- **Descartado:** varios pagadores en un mismo gasto desde el MVP, porque contradice el conceptual y complica el cálculo de deudas; queda como extensión futura.

## 2026-09-23 23:32 — P13: división en partes iguales

- **Decisión:** se reparte entre los elegidos. A pedido del usuario, la lista arranca sin nadie seleccionado, con una casilla por participante y un botón que alterna entre "Seleccionar a todos" y "Quitar a todos". El pagador puede quedar fuera de los elegidos. Las unidades sobrantes se asignan de a una a los primeros de la lista.
- **Descartado:** repartir siempre entre todos los participantes, como dice el texto del diagrama; lista inicial con todos marcados, que era la propuesta original y el usuario cambió.

## 2026-09-23 23:32 — P14: deuda acumulada

- **Decisión:** deuda acumulada por viaje, deudor y acreedor, con el detalle de cada gasto en `gasto_parte` y una prueba de invariante del saldo neto por par.
- **Descartado:** una deuda por gasto, porque un pago que cubre varios gastos tendría que restar a varias deudas; no guardar la deuda y calcularla siempre, porque el conceptual la trata como entidad y el pago necesita a qué restar.

## 2026-09-23 23:32 — P15: deudas en sentidos opuestos

- **Decisión:** se compensan al anotar el gasto, dentro de la misma transacción, y entre dos viajeros queda una sola deuda neta. La simplificación de deudas de todo el grupo queda como extensión futura.
- **Descartado:** guardar ambas deudas y mostrar el neto, porque vuelve ambiguo el pago; no compensar, porque obliga a mover más plata de la necesaria.

## 2026-09-23 23:32 — P16: categorías y moneda

- **Decisión:** seis categorías (alojamiento, transporte, comida, actividades, compras, otros) en la tabla `categoria_gasto`, para que sumar una sea agregar datos y no modificar código; una moneda por viaje, elegida al crearlo, sin conversión. En coherencia con el criterio de las categorías, las monedas también se guardan en una tabla `moneda`, y los montos pasan a expresarse en la unidad mínima de la moneda del viaje en lugar de centavos, para admitir monedas sin decimales.
- **Descartado:** enumerado de categorías en el código; una sola moneda (pesos) para toda la aplicación; varias monedas con conversión dentro de un viaje, que queda como extensión futura.

## 2026-09-23 23:32 — P17: registro de pagos

- **Decisión:** solo el deudor registra pagos; no hay confirmación del acreedor; en el MVP no se deshacen pagos ni se editan gastos; cada pago guarda quién lo registró y cuándo y aparece en el historial de ambos.
- **Descartado:** que el acreedor también registre pagos; un estado "pendiente de confirmar"; anular pagos en el MVP. Editar o anular gastos y pagos queda como extensión futura.

## 2026-09-23 23:32 — P18: bajas de participantes

- **Decisión:** la baja nunca borra historial y registra si había deuda; quien se va con saldos pendientes conserva acceso solo a la sección de saldos hasta que queden en cero; se puede salir del grupo con deuda, con aviso previo; al darse de baja se retiran sus votos en propuestas pendientes; volver a agregar a alguien reactiva su misma membresía.
- **Descartado:** borrar el historial en la rama sin deuda, porque rompería referencias; quitar todo acceso, porque el deudor no podría pagar; impedir la salida hasta saldar las deudas, porque podría dejar a alguien atrapado en un viaje.

## 2026-09-23 23:32 — P19: día inicial del mapa

- **Decisión:** si no hay ninguna actividad confirmada, se muestra el primer día del viaje con el aviso de día sin actividades; "hoy" es la fecha del dispositivo; si hoy cae dentro del viaje sin actividades, se muestra hoy con el aviso.
- **Descartado:** usar la fecha del servidor, que falla con viajes a otro huso horario.

## 2026-09-23 23:32 — P20: recorrido

- **Decisión:** líneas rectas que unen las actividades en orden cronológico, con la implementación `RecorridoEnLineaRecta` de `ProveedorRecorrido`.
- **Descartado:** trazado por calles desde el MVP, porque requiere clave o un servidor sin garantías y adelanta el Release 4.

## 2026-09-23 23:32 — P21: cronograma

- **Decisión:** todos los días del viaje, incluidos los vacíos; solo actividades confirmadas con horario, título, ubicación y enlace al mapa; alojamiento confirmado de cada noche sin contar el día de salida; al abrir, desplazamiento hasta hoy si cae dentro del viaje.
- **Descartado:** mostrar propuestas pendientes en el cronograma, porque ya tienen su pantalla de votación.

## 2026-09-23 23:32 — P22: versiones del story mapping

- **Decisión:** "Página-13" es la versión final. Preferencias de habitación se suma al Release 2 y exportar gastos a Excel al Release 7 "Comprobantes", porque "Página-13" no tiene un release dedicado a gastos. La llamada grupal queda descartada. Las diferencias entre los diagramas y el plan se listan en la sección 10.2 de `PLAN.md` y se trasladarán a `docs/diagramas.drawio` en una tarea aparte, con aprobación del usuario.
- **Descartado:** ubicar la exportación a Excel en el Release 2; documentar las diferencias solo en el plan sin actualizar el `.drawio`.

## 2026-09-23 23:32 — Actualización de PLAN.md con las decisiones

- **Acción:** se reescribió `PLAN.md` para integrar las 22 decisiones y el principio SOLID. Cambios principales: CU24 a CU26 en la trazabilidad; sección 2 con los principios obligatorios, las capas y la nueva estructura de carpetas; sección 3 con D5 modificada y D6, D7 y D14 nuevas (decisiones renumeradas de D1 a D21); tablas `credencial`, `sesion`, `moneda` y `categoria_gasto` en el DER; API, reglas y fases ajustadas a cada respuesta; releases 2 y 7 ampliados y extensiones surgidas de las decisiones; sección 10 convertida en resumen de decisiones más la tabla de diferencias con los diagramas.
- **Archivos:** se modifica `PLAN.md`.
- **Decisión:** se reescribió el archivo completo en lugar de editar sección por sección, porque los cambios alcanzaban a todas las secciones y la renumeración de decisiones afectaba referencias cruzadas.

## 2026-09-23 23:32 — Primer commit y push

- **Acción:** con autorización del usuario, se hace el primer commit del repositorio con `PLAN.md`, `LOG.md` y `docs/diagramas.drawio`, y se sube a la rama `claude/elegant-maxwell-60322c`.
- **Archivos:** ninguno nuevo; se versionan los tres existentes.
- **Decisión:** un único commit para la etapa de planificación, porque todavía no hay código y el plan con sus decisiones forma una sola unidad revisable.

## 2026-09-23 23:39 — GRASP, patrones de diseño y criterio contra la sobreingeniería

- **Acción:** el usuario pidió que la arquitectura, además de SOLID, cumpla GRASP y use patrones de diseño cuando sea necesario, evitando la sobreingeniería. Se propuso cómo aplicarlo, el usuario lo aprobó y se actualizó `PLAN.md`.
- **Archivos:** se modifica `PLAN.md` (sección 2.2 dividida en SOLID, GRASP, patrones y criterio; sección 2.3; nueva decisión D22; columna "Dónde" de la sección 6; reglas y entregables de la sección 8; nota de la sección 10.1).
- **Decisión:** aplicar GRASP lleva las reglas a las entidades que tienen los datos (experto en información). `Propuesta` maneja sus transiciones y votos; `Deuda` suma, se compensa y registra pagos; `Viaje` controla fechas, día inicial del mapa, traspaso y salida; `Membresia` maneja bajas, reactivación y tipo de acceso; los objetos de valor `Dinero`, `RangoFechas` e `Intervalo` encapsulan reparto, rangos y superposición. Los casos de uso quedan como controladores que coordinan. Los patrones adoptados son Strategy, Repository, Unit of Work, Adapter, Observer como eventos de dominio (`NotificadorViaje` se suscribe en lugar de ser llamado por los casos de uso), Value Object, Composition Root y Chain of Responsibility (propia de Express). Criterio: una abstracción se agrega solo si aísla una dependencia externa, cubre una variación prevista o es necesaria para probar sin infraestructura. Abierto/cerrado se aplica en esos puntos, que coinciden con las variaciones protegidas de GRASP.
- **Descartado:** modelo anémico con toda la lógica en servicios, porque dispersa reglas entre casos de uso; patrón State para los estados de propuesta, porque con cuatro estados basta una tabla de transiciones; repositorio genérico, Abstract Factory, CQRS, reconstrucción del estado a partir de eventos, contenedor de inyección y microservicios, por sobreingeniería.

## 2026-09-23 23:39 — Commit y push de la actualización

- **Acción:** con autorización del usuario, se hace commit de `PLAN.md` y `LOG.md` y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** ninguno nuevo.
