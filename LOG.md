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

## 2026-09-23 23:42 — Inicio de la actualización de los diagramas

- **Acción:** se empieza a trasladar a `docs/diagramas.drawio` las diferencias de la sección 10.2 de `PLAN.md`, más dos diagramas de actividad nuevos pedidos por el usuario: "Saliendo del grupo" y "Transfiriendo administración".
- **Archivos:** se modificará `docs/diagramas.drawio`.
- **Decisión:** se edita el XML de cada página directamente, copiando los estilos de las figuras existentes, con scripts descartables fuera del repo. Se descartó el flujo del skill `actualizando-diagramas-uml` porque genera un `.drawio` de una sola página a partir de PlantUML: habría borrado las otras diez páginas, convertido el conceptual en una imagen no editable por figuras y requerido instalar Graphviz y PlantUML. También se descartó aplicar el skill solo al conceptual, porque esa página quedaría con otro aspecto y otra forma de edición que el resto.

## 2026-09-23 23:53 — Diagramas actualizados

- **Acción:** se actualizó `docs/diagramas.drawio` con las diferencias de la sección 10.2 de `PLAN.md` y se agregaron dos páginas nuevas. El archivo pasa de 11 a 13 páginas.
- **Archivos:** se modifican `docs/diagramas.drawio` y `PLAN.md` (introducción y sección 10.2, que ahora indican que las diferencias ya están en los diagramas).
- **Cambios por página:**
  - **Casos de uso:** se agregan "Transfiriendo administración" (Admin), "Cerrando sesión" (Viajero), y "Registrándose" e "Iniciando sesión", asociados a un actor nuevo, Visitante; el límite del sistema se agranda para contenerlos.
  - **Página-13:** se agregan "Admin transfiere la administración", "Viajero desvota alojamiento" y "Viajero desvota actividad" al MVP; "Viajero ingresa preferencia de habitación (solo o compartida)" al Release 2; y "Viajero exporta los gastos a Excel" al Release 7. Los releases siguientes se desplazan hacia abajo para hacer lugar.
  - **Diagrama conceptual:** regenerado con los mismos estilos. Se quitó la clase Admin; se agregaron Membresía, Credencial, Sesión, Moneda, CategoríaGasto, GastoParte y la enumeración EstadoPropuesta; se agregaron los atributos nuevos, la asociación reflexiva "alternativa de" y la composición Gasto–GastoParte; la relación Gasto–Deuda pasa a ser una dependencia «suma» desde GastoParte.
  - **Proponiendo alternativa de actividad, Anotando gasto, Consultando mapa y Eliminando participantes:** regenerados con los mismos estilos para incorporar las reglas de P9, P12, P13, P15, P18 y P19.
  - **Nuevas:** "Saliendo del grupo" y "Transfiriendo administración", ubicadas junto a los demás diagramas de actividad.
- **Decisiones:**
  - Se agregó el actor Visitante para registro e inicio de sesión, porque quien todavía no tiene cuenta no es un Viajero. Se descartó asociarlos al Viajero.
  - En el conceptual solo se dibujó la enumeración EstadoPropuesta, que la sección 10.2 pedía completar; los demás tipos (Rol, EstadoMembresia, ModoDivision, TipoCredencial) quedan como tipos de atributo, igual que CategoriaGasto en el diagrama original. Se descartó dibujar todas las enumeraciones porque sumaban cinco relaciones de dependencia sin aportar información nueva.
  - La relación Viaje–Deuda se trazó rodeando el diagrama por arriba y por la derecha para no cruzar las relaciones del Viajero.
- **Verificación:**
  - El XML es válido, no hay identificadores repetidos y todas las referencias apuntan a figuras existentes.
  - Las páginas "Proponiendo actividad", "Registrando pago", "story mapping" y "Copia de story mapping" quedaron idénticas a las originales.
  - Se renderizó cada página modificada a una imagen con un visor propio para revisarla, y se comprobó automáticamente que ninguna línea nueva atraviesa una figura. El único cruce detectado ya existía en el original (la línea de "Desvotando actividad" en casos de uso) y no se tocó.
  - Los scripts de generación y verificación quedaron fuera del repo.

## 2026-09-24 00:06 — Commit y push de la actualización de diagramas

- **Acción:** con autorización del usuario, se hace commit de `docs/diagramas.drawio`, `PLAN.md` y `LOG.md` y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** ninguno nuevo.

## 2026-09-24 00:08 — Inicio de F0: base del repositorio

- **Acción:** comienza la fase F0 de `PLAN.md` (monorepo que compila, prueba y levanta frontend, backend y base de datos).
- **Archivos:** se crearán los archivos de configuración de raíz, `apps/api`, `apps/web` y `packages/compartido`.
- **Contexto del entorno:** Node 22.22 y npm 10.9 disponibles, registro de npm accesible, Docker instalado pero sin su servicio en ejecución, y PostgreSQL 16 instalado localmente.

## 2026-09-24 00:12 — F0 terminada: base del repositorio

- **Acción:** se armó el monorepo con los tres paquetes y se verificó el criterio de terminado de F0.
- **Archivos creados:**
  - **Raíz:** `package.json` (workspaces y scripts), `package-lock.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `.env.example`, `docker-compose.yml` y `README.md`.
  - **`packages/compartido`:** `package.json`, `tsconfig.json` y `src/` con los contratos de la respuesta de error (D19) y de `/api/salud`.
  - **`apps/api`:** `package.json`, dos `tsconfig` (uno para chequeo con pruebas y otro para compilar), `vitest.config.ts`, `src/app.ts`, `src/servidor.ts`, `src/config.ts`, `src/contenedor.ts`, `src/compartido/errores.ts`, `src/middlewares/manejarErrores.ts`, `src/modulos/salud/salud.rutas.ts` y pruebas en `test/unitarias` y `test/integracion`.
  - **`apps/web`:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/App.vue`, `src/router/index.ts`, `src/vistas/InicioVista.vue`, `src/clientes/salud.ts` y `test/InicioVista.test.ts`.
- **Archivos modificados:** `PLAN.md` (desvíos de F0 y nueva decisión D23).
- **Decisiones:**
  - **Errores de dominio (D19):** `ErrorDeDominio` lleva una categoría del dominio (validación, no autenticado, prohibido, no encontrado, conflicto, regla de negocio, demasiados intentos). El middleware `manejarErrores` traduce esa categoría a HTTP con una tabla cerrada, así el dominio no conoce HTTP y cada código nuevo no obliga a tocar la traducción. Los errores inesperados responden 500 `ERROR_INTERNO` sin exponer detalles. Se descartó que cada error llevara su código HTTP, porque acoplaría el dominio a la capa web.
  - **Módulo de salud:** es un solo archivo de rutas y no tiene la estructura de capas de los módulos de dominio, por el criterio contra la sobreingeniería (2.2.4 de `PLAN.md`), ya que no tiene reglas de negocio ni datos.
  - **Frontend:** `InicioVista` depende de la interfaz `ClienteSalud`, que `main.ts` inyecta con `provide`; así se aplica la inversión de dependencias desde la primera pantalla y la prueba usa un cliente falso.
  - **Chequeo de tipos:** `npm run lint` incluye el chequeo de tipos de cada paquete, porque la compilación del backend no revisa los archivos de prueba.
  - **Versiones y herramientas:** se registran en D23.
- **Desvíos del plan:** los scripts `db:reset` y `e2e` pasan a F1 y F9, cuando existen Prisma y Playwright, en lugar de dejar scripts de relleno que fallarían. Las carpetas vacías previstas (`stores`, `composables`, `test/contratos`) se crean cuando se usen, porque git no versiona carpetas vacías.
- **Verificación del criterio de terminado:**
  - `docker compose up -d` levanta las dos bases, que quedan saludables y aceptan conexiones en 5432 y 5433.
  - `npm run dev` levanta todo. `curl localhost:3000/api/salud` y `curl localhost:5173/api/salud` (a través del proxy de Vite) devuelven `200 {"ok":true}`, y la web cargada en Chromium muestra "Servidor disponible".
  - En un clon limpio, `npm ci`, `npm run build`, `npm test` (14 pruebas: 12 del backend y 2 del frontend) y `npm run lint` terminan sin errores.
- **Entorno:** para verificar se inició el servicio de Docker de la sesión, que estaba detenido.

## 2026-09-24 00:15 — Commit y push de F0

- **Acción:** con autorización del usuario, se hace commit de F0 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada anterior, más esta entrada en `LOG.md`.

## 2026-09-24 00:19 — Inicio de F1: modelo de datos e infraestructura común

- **Acción:** comienza la fase F1 de `PLAN.md` (esquema de la sección 4 en PostgreSQL, semilla, `UnidadDeTrabajo` y objetos de valor).
- **Decisión:** se usa Prisma 7.10, la última versión estable. Se descartó la 8.0, que es la que npm marca como `latest` pero todavía es candidata (`rc`), para no depender de una versión sin publicar como estable.

## 2026-09-24 00:30 — F1 terminada: modelo de datos e infraestructura común

- **Acción:** se implementó el esquema de la sección 4 de `PLAN.md` con Prisma 7.10 y se verificó el criterio de terminado de F1.
- **Archivos creados** (en `apps/api`):
  - **Base de datos:** `prisma.config.ts`, `prisma/schema.prisma`, `prisma/migrations/20260924032214_inicial/migration.sql` y `prisma/seed.ts`.
  - **Código:** `src/compartido/valores/` (`dinero.ts`, `fecha.ts`, `rangoFechas.ts`, `intervalo.ts`), `src/compartido/unidadDeTrabajo.ts`, `src/compartido/eventos.ts`, `src/compartido/infraestructura/prisma.ts` y `src/compartido/infraestructura/unidadDeTrabajoPrisma.ts`.
  - **Soporte de pruebas:** `test/soporte/` (unidad de trabajo en memoria, conexión y preparación de la base de prueba).
  - **Pruebas:** `test/contratos/` (contrato de la unidad de trabajo y sus dos ejecuciones), `test/unitarias/` (`dinero`, `rangoFechas`, `intervalo`, `eventos`) y `test/integracion/restricciones.bd.test.ts`.
- **Archivos modificados:** `apps/api/package.json` (scripts `generar`, `postinstall`, `db:migrar` y `db:reset`; dependencias de Prisma y `pg`), `apps/api/vitest.config.ts` (dos proyectos), `package.json` de raíz (`db:reset`), `.gitignore`, `.prettierignore` y `eslint.config.js` (ignoran el cliente generado), y `PLAN.md` (D24, restricciones agregadas en 4.3 y entregables de F1).
- **Decisiones:**
  - **Montos:** se guardan como `BIGINT` y el dominio los maneja como enteros seguros de JavaScript (D24).
  - **Restricciones agregadas en la migración**, además de las previstas en 4.3: coherencia entre `estado` y `baja_en` en `membresia`, coordenadas dentro de rango en `propuesta` y cantidad de decimales en `moneda`. Se verificó con `prisma migrate diff` que Prisma no detecta diferencias por el índice parcial ni por los `CHECK`, así que las migraciones futuras no los borran.
  - **Fechas:** los días calendario se representan como texto `YYYY-MM-DD` (`fecha.ts`), que se compara directamente y no depende de zonas horarias (D17). `Intervalo` usa minutos y es semiabierto, así dos actividades contiguas no se superponen.
  - **Eventos de dominio:** `BusDeEventosEnMemoria` implementa el Observer previsto en 2.2.3; los eventos concretos llegan en F2 y F6.
  - **Pruebas:** se separan en un proyecto rápido y otro con base (archivos `*.bd.test.ts`), que corre de a un archivo y vacía las tablas antes de cada prueba.
  - **Semilla:** no incluye credenciales, porque el hash de contraseñas llega en F2 con el módulo de autenticación.
- **Desvío del plan:** la base de prueba se prepara con `prisma migrate deploy` en lugar de `migrate reset`. Se descartó el reset porque Prisma lo bloquea cuando lo ejecuta un agente de IA y porque no hace falta: la base de prueba vive en memoria y cada prueba vacía las tablas.
- **Consentimiento del usuario:** Prisma exige consentimiento explícito para `migrate reset` cuando lo ejecuta un agente. Se le pidió al usuario, indicando el comando, el motivo, que borra los datos en forma irreversible y que la base era la de desarrollo local del contenedor de la sesión. El usuario autorizó ("Sí, autorizo resetear la base de desarrollo local") y el comando se ejecutó solo sobre `localhost:5432/viajes`.
- **Auditoría de dependencias:** `npm audit` reporta vulnerabilidades en `mysql2`, una dependencia de la línea de comandos de Prisma que solo se usa en desarrollo. No afecta a la aplicación, que usa PostgreSQL. Se descartó `npm audit fix --force` porque bajaría Prisma a la versión 6.
- **Verificación del criterio de terminado:**
  - `npm run db:reset` aplica la migración y la semilla sin errores. Quedan 4 usuarios y 9 propuestas en los cuatro estados, incluida una actividad con dos alternativas, 2 gastos (uno en partes iguales y otro arbitrario), 5 deudas, 1 pago, 6 categorías y 6 monedas.
  - Una consulta SQL confirmó que el saldo neto de cada par de viajeros coincide con lo que surge de las partes de los gastos menos los pagos.
  - `npm test` pasa 51 pruebas (49 del backend y 2 del frontend). Entre ellas:
    - las de restricciones: voto y credencial duplicados, deuda consigo mismo y negativa, segundo Admin activo, rango de fechas invertido, email sin normalizar y coordenadas incompletas;
    - el contrato de la unidad de trabajo para las dos implementaciones, incluida la reversión ante un error;
    - las de los objetos de valor: reparto con resto, bordes de rango e intervalos contiguos y que pasan la medianoche.
  - En un clon limpio, `npm ci` genera el cliente y `npm run build`, `npm test` y `npm run lint` terminan sin errores.

## 2026-09-24 00:35 — Commit y push de F1

- **Acción:** con autorización del usuario, se hace commit de F1 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada de cierre de F1, más esta entrada en `LOG.md`.
