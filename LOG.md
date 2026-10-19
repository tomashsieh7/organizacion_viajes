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

## 2026-09-24 00:38 — Inicio de F2: autenticación y gestión del grupo

- **Acción:** comienza la fase F2 de `PLAN.md`: registro, sesiones y medidas de seguridad (P3, D5, D6, D7), creación de viajes y gestión de participantes y de la administración (CU01 a CU04 y CU24), con sus pantallas.
- **Dependencias nuevas:** `@node-rs/argon2` (hash argon2id con binarios precompilados, D5), `helmet` (encabezados de seguridad), `express-rate-limit` (límite de intentos, D6) y `cookie-parser` (lectura de la cookie de sesión) en el backend; `zod` en el paquete compartido, para que backend y frontend usen los mismos esquemas (D12).

## 2026-09-24 00:53 — F2 terminada: autenticación y gestión del grupo

- **Acción:** se implementaron el registro, las sesiones y las medidas de seguridad (P3, D5, D6, D7), la creación de viajes y la gestión de participantes y de la administración (CU01 a CU04 y CU24), con sus pantallas, y se verificó el criterio de terminado de F2.
- **Archivos creados:**
  - **Paquete compartido:** `esquemas.ts` (esquemas Zod de registro, ingreso, viaje nuevo, agregar viajero, salir y traspaso) y `contrasenasComunes.ts`; `contratos.ts` se amplió con los tipos de respuesta.
  - **Backend, módulo `auth`:** `dominio/` (puertos, `EmailContrasena`, `ServicioDeSesiones`), `casos-de-uso/`, `infraestructura/` (argon2id, tokens, repositorios Prisma y buscador de usuarios) y `auth.rutas.ts`.
  - **Backend, módulo `viajes`:** `dominio/` (agregado `Viaje` con `Membresia`, eventos y puertos), `casos-de-uso/`, `infraestructura/prisma.ts` y `viajes.rutas.ts`.
  - **Backend, compartido:** `middlewares/` (`acceso.ts`, `seguridad.ts`, `validar.ts`), `compartido/reloj.ts`, `compartido/infraestructura/conversiones.ts` y `tipos/express.d.ts`.
  - **Pruebas del backend:** `test/soporte/` (implementaciones en memoria, escenarios y cliente HTTP de prueba), `test/contratos/` (repositorios y `ProveedorAutenticacion`), `test/unitarias/` (`viaje`, `auth` y casos de uso de viajes) y `test/integracion/` (`auth.bd` y `viajes.bd`).
  - **Frontend:** `clientes/` (`http`, `auth`, `viajes`), `stores/` (`sesion`, `viaje`), `componentes/base/` (`CampoFormulario`, `AvisoMensaje`, `DialogoModal`), `componentes/viajes/` (`DialogoNuevoViaje`, `ListaParticipantes`, `FormularioAgregarViajero`, `SelectorSucesor`, `DialogoTraspaso`, `DialogoSalir`), `vistas/` (`IngresoVista`, `RegistroVista`, `ViajesVista`, `ViajeLayout`, `ParticipantesVista`) y `utiles/formato.ts`, con sus pruebas en `test/`.
  - **Documentación:** `docs/api.md`.
- **Archivos modificados:** `app.ts`, `config.ts` (`DATABASE_URL`, `SESION_DIAS`), `contenedor.ts`, `compartido/infraestructura/prisma.ts`, la semilla (credenciales de ejemplo), el router, `App.vue` y `main.ts` del frontend, y `PLAN.md`. Se eliminaron `InicioVista.vue`, `clientes/salud.ts` y su prueba, porque la pantalla de inicio de F0 se reemplazó por la lista de viajes; `GET /api/salud` se mantiene.
- **Decisiones:**
  - **GRASP:** `Viaje` es el agregado experto en participantes y administración: agrega, elimina, reactiva, transfiere y da de baja, y registra eventos de dominio que el caso de uso publica recién después de confirmar la transacción. Los casos de uso cargan el viaje con `SELECT … FOR UPDATE`, así dos operaciones simultáneas sobre el mismo viaje se ejecutan de a una. Al guardar, las membresías que dejan de ser Admin se escriben antes que la del nuevo Admin, para no violar el índice de Admin único.
  - **Interfaz del lado del consumidor:** el módulo de viajes necesita buscar usuarios por email, así que define la interfaz `BuscadorDeUsuarios` en su dominio y la implementa el módulo de autenticación. Así los viajes no dependen de las credenciales (inversión de dependencias).
  - **Seguridad:** los tokens de sesión se guardan como hash SHA-256. Los contadores de intentos viven en memoria y se crean por instancia de la app. El registro tiene un límite de 10 por hora por IP. La lista de contraseñas comunes está en el paquete compartido, así el formulario las rechaza antes de enviar.
  - **Registro:** deja la sesión iniciada (201 con cookie). Se descartó obligar a ingresar después de registrarse, porque es un paso más sin beneficio de seguridad.
  - **Respuestas de la API:** `GET /api/viajes/:viajeId` incluye la deuda pendiente de quien consulta, que el diálogo de salida muestra antes de confirmar (RN-E7). Eliminar y salir responden `{ bajaConDeuda }` y el traspaso responde 204.
  - **Frontend:** los stores obtienen sus clientes de API con `inject`, y las pruebas montan las vistas con clientes falsos. Los componentes base tienen nombres de dos palabras, como pide la regla de ESLint para Vue.
  - **Estructura de módulos:** cada módulo tiene un archivo `<modulo>.rutas.ts` con rutas y controlador juntos, porque el controlador es una traducción delgada entre HTTP y casos de uso. Se descartó separarlos en carpetas propias por el criterio contra la sobreingeniería.
- **Desvío del plan:** `GET /api/viajes` lista por ahora solo las membresías activas; los viajes con acceso solo a saldos (RN-E6) se suman en F7, junto con el middleware `accesoSaldos`.
- **Entorno:** el servicio de Docker de la sesión se detuvo durante la fase y se volvió a iniciar. Además, la preparación de la base de prueba ahora explica el error si la base no está levantada.
- **Verificación del criterio de terminado:**
  - `npm test` pasa 143 pruebas: 134 del backend (81 rápidas y 53 contra la base) y 9 del frontend. Entre ellas:
    - las pruebas de cada endpoint de 5.2 y 5.3 con sus errores;
    - las de seguridad: bloqueo tras 5 intentos fallidos, mismo mensaje con email existente e inexistente, sesión inválida tras cerrar sesión, atributos de la cookie, rechazo de otro `Origin`, encabezados de helmet y argon2id en la base;
    - las de baja con y sin deuda: historial conservado, votos pendientes retirados y 403 posterior;
    - la de dos traspasos simultáneos, que deja exactamente un Admin;
    - los contratos de repositorios y de `ProveedorAutenticacion` para las implementaciones en memoria y en Prisma;
    - la prueba de componente que oculta las acciones de Admin a un viajero común.
  - `npm run lint` pasa sin errores, con chequeo de tipos.
  - Recorrido manual en Chromium con `npm run dev`: dos personas se registran, Ana crea un viaje, agrega a Tomás por email escrito en mayúsculas, Tomás entra sin ver acciones de Admin, Ana lo elimina, Tomás ya no puede entrar, y Ana cierra sesión y la guarda de ruta la manda a ingresar.
- **Pendiente para el usuario:** la base de desarrollo tiene los datos de ejemplo cargados antes de sumar las credenciales. Para ingresar con `ana@ejemplo.com` y la contraseña de ejemplo hay que ejecutar `npm run db:reset`, que borra la base de desarrollo; no se ejecutó sin autorización.

## 2026-09-24 00:54 — Commit y push de F2

- **Acción:** con autorización del usuario, se hace commit de F2 y push a `claude/elegant-maxwell-60322c`. No se reseteó la base de desarrollo, porque el usuario no respondió sobre eso.
- **Archivos:** los de la entrada de cierre de F2, más esta entrada en `LOG.md`.

## 2026-09-24 00:56 — Inicio de F3: propuestas y alojamientos

- **Acción:** comienza la fase F3 de `PLAN.md`: mecanismo común de propuestas (votar, desvotar, confirmar, denegar y cancelar) y alojamientos (CU05 a CU09 y CU25), con el buscador de ubicaciones.
- **Dependencias nuevas:** `leaflet` (D9) en el frontend.
- **Entorno:** la red de la sesión bloquea `nominatim.openstreetmap.org` y `tile.openstreetmap.org`. El adaptador de Nominatim se prueba con respuestas simuladas, y en el navegador de la sesión el mapa se ve sin teselas; marcar un punto con un clic funciona igual.

## 2026-09-24 01:10 — F3 terminada: propuestas y alojamientos

- **Acción:** se implementaron el mecanismo común de propuestas (votar, desvotar, confirmar, denegar y cancelar) y los alojamientos (CU05 a CU09 y CU25), con el buscador de ubicaciones y el mapa para marcar puntos, y se verificó el criterio de terminado de F3.
- **Archivos creados:**
  - **Paquete compartido:** esquemas de voto, filtro por estado y alojamiento nuevo, y tipos `PropuestaVista`, `AlojamientoVista` y `RespuestaResolucion`.
  - **Backend:**
    - módulo `propuestas`: entidad `Propuesta` con su tabla de transiciones, puertos con `ReglaAlResolver`, casos de uso `Votar` y `ResolverPropuesta`, infraestructura Prisma y rutas;
    - módulo `alojamientos`: puertos, casos de uso `ProponerAlojamiento` y `ConsultarAlojamientos`, infraestructura Prisma y rutas;
    - objeto de valor `Coordenadas`.
  - **Pruebas del backend:** `propuesta.test.ts`, `casosDeUsoPropuestas.test.ts`, `propuestas.bd.test.ts` y los contratos ampliados.
  - **Frontend:**
    - clientes `propuestas.ts` y `ubicaciones.ts` (`BuscadorUbicaciones` y adaptador de Nominatim);
    - store `propuestas`;
    - componentes `TarjetaPropuesta`, `MapaSelector` (Leaflet) y `CampoUbicacion`;
    - vistas `AlojamientosVista` y `AlojamientoFormularioVista`;
    - utilidad `aUnidadMinima`;
    - pruebas de la tarjeta, del contrato del buscador, del formato de montos y de los stores de sesión y de propuestas.
- **Archivos modificados:** `app.ts` y `contenedor.ts`; `viajes.rutas.ts` (rutas separadas en generales y de viaje); las implementaciones en memoria y los escenarios de prueba (la base en memoria guarda propuestas completas con sus votos); `eslint.config.js`; el router, el menú del viaje y `main.ts` del frontend; `docs/api.md`; y `PLAN.md` (D8 y entregables de F3).
- **Decisiones:**
  - **Punto de extensión de la resolución (abierto/cerrado):** `ResolverPropuesta` recibe una lista de `ReglaAlResolver` que se ejecutan dentro de la transacción. Es genérico sobre los repositorios de la transacción, así F4 suma las políticas de superposición y de opciones desde el punto de composición sin modificar este código.
  - **Propuesta:** la entidad maneja solo lo común: estado, votos y resolución. Los datos propios de cada tipo los guarda el repositorio de su módulo.
  - **Rutas:** todas las rutas dentro de un viaje se montan en un único router que verifica la sesión y la membresía una sola vez. Se descartó que cada módulo repitiera esos middlewares, porque cada petición haría las mismas consultas varias veces.
  - **Buscador de ubicaciones:** vive en el frontend y consulta Nominatim desde el navegador. Espera 600 ms después de la última tecla, por el límite de uso de Nominatim, y ofrece marcar el punto con un clic si el servicio falla.
  - **Mapa:** el marcador es un círculo de Leaflet, para no depender de las imágenes de íconos, que se rompen al empaquetar con Vite.
  - **Precios:** se escriben en pesos y se convierten a la unidad mínima de la moneda. Se acepta "48000", "48000,50" y "48.000,50"; el punto se lee como separador de miles, como se escribe en castellano.
  - **Lint:** la regla de variables sin usar ahora ignora las que se descartan al separar propiedades con `...resto`, que es un patrón válido.
- **Errores encontrados y corregidos:**
  - Al arrancar el entorno de desarrollo, la API se reinicia cuando termina de compilar el paquete compartido. Si la guarda de ruta consultaba la sesión en ese momento, la navegación inicial fallaba y la página quedaba en blanco. Ahora una falla al consultar la sesión se trata como sin sesión y se reintenta en la próxima navegación. Lo cubre una prueba nueva.
  - El store de propuestas tomaba el viaje recién al cargar la lista, así que al entrar directo al formulario de alta enviaba la petición sin viaje. Ahora usa siempre el viaje abierto. Lo cubre una prueba nueva.
- **Entorno:** la red de la sesión bloquea Nominatim y las teselas de OpenStreetMap. El adaptador de Nominatim se probó con una respuesta grabada, y en el recorrido manual el mapa se vio sin teselas, con el marcado por clic funcionando.
- **Verificación del criterio de terminado:**
  - `npm test` pasa 201 pruebas: 175 del backend y 26 del frontend. Entre ellas:
    - la matriz completa de transiciones, en la entidad y a través de la API;
    - el reemplazo de voto, el desvoto y la prohibición de votar o desvotar propuestas resueltas;
    - el rechazo de alojamientos fuera de las fechas del viaje;
    - los contratos de los repositorios nuevos, en memoria y en Prisma;
    - el contrato de `BuscadorUbicaciones` con una implementación falsa y con el adaptador de Nominatim;
    - la prueba de componente de `TarjetaPropuesta` para los dos roles.
  - `npm run lint` pasa sin errores.
  - Recorrido manual en Chromium: Tomás propone un alojamiento marcando el punto en el mapa y con precio "48.000", que se muestra como $ 48.000,00. Tomás vota a favor, Ana vota en contra y lo confirma, y el filtro por estado funciona.

## 2026-09-24 01:13 — Commit y push de F3

- **Acción:** con autorización del usuario, se hace commit de F3 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada de cierre de F3, más esta entrada en `LOG.md`.

## 2026-09-24 01:14 — Inicio de F4: actividades y alternativas

- **Acción:** comienza la fase F4 de `PLAN.md`: proponer actividades y alternativas con control de superposición horaria (CU10, CU11, RN-A1 a RN-A3, RN-B1 a RN-B3), consultar una actividad (CU18), y resolverlas con el mecanismo de F3 sumando las políticas de superposición y de opciones como reglas inyectadas (RN-R3, RN-R4). CU12 a CU15 y CU26 reutilizan los endpoints de propuestas.

## 2026-09-24 01:34 — F4 terminada: actividades y alternativas

- **Acción:** se implementa F4 completa, backend y frontend.
- **Archivos creados:**
  - **Paquete compartido:** `hora.ts`, con `sumarMinutos` y `pasaLaMedianoche`. Los usan la API para calcular la hora de fin y la web para mostrar horarios y conflictos.
  - **Módulo `actividades` del backend:**
    - dominio: `actividad.ts` (entidad `Actividad` con `proponer()`, `crearAlternativa()`, `intervalo` y `grupo`), `politicas.ts` (`PoliticaSuperposicion` con `SinSuperposicionConConfirmadas`, y `PoliticaResolucionOpciones` con `DenegarOpcionesRestantes`) y `puertos.ts`;
    - casos de uso: `casosDeUsoActividades.ts` (`ProponerActividad`, `ProponerAlternativa`, `ConsultarActividades`), `reglasDeResolucion.ts` (`ReglaSuperposicionAlConfirmar` y `ReglaOpcionesAlConfirmar`) y `agendaBloqueadaPrimero.ts`;
    - infraestructura: `prisma.ts` (repositorio y consulta);
    - rutas: `actividades.rutas.ts`.
  - **Pruebas del backend:**
    - `actividad.test.ts`, `casosDeUsoActividades.test.ts`, `agendaBloqueadaPrimero.test.ts` y `hora.test.ts`;
    - `politicas.contrato.ts` con `politicas.test.ts`;
    - `actividades.bd.test.ts`.
  - **Frontend:**
    - componentes `TarjetaActividad`, `ListaAlternativas`, `CampoFechaHora` y `AvisoSuperposicion`;
    - vistas `ActividadesVista` y `ActividadFormularioVista`, que sirve para proponer una actividad y una alternativa;
    - utilidad `agruparOpciones`;
    - pruebas de las dos vistas, de la agrupación y del formato de horarios.
- **Archivos modificados:**
  - Paquete compartido: `esquemas.ts` (`esquemaHora` y `esquemaActividadNueva`), `contratos.ts` (`ActividadVista` y `ConflictoHorario`) e `index.ts`.
  - Backend: `app.ts`, `contenedor.ts`, `propuestas.rutas.ts`, `conversiones.ts` (`aHora` y `deHora`), y los soportes de prueba (implementaciones en memoria, escenarios y contratos de repositorios).
  - Frontend: el cliente y el store de propuestas, `formato.ts`, el router, el menú del viaje y los clientes falsos de las pruebas.
  - Documentación: `docs/api.md` y `PLAN.md` (listado de actividades de la sección 5.6).
- **Decisiones:**
  - **Reglas de resolución:** la superposición al confirmar (RN-R3) y la denegación de las demás opciones (RN-R4) son dos `ReglaAlResolver` que se registran en `contenedor.ts`. `ResolverPropuesta` no se modificó, así que el punto de extensión de F3 cumplió su función (abierto/cerrado).
  - **Políticas como estrategias:** las dos políticas son interfaces con una implementación del MVP. Son el punto de variación previsto para los subgrupos del Release 3, que motivaron la reserva del usuario sobre P9. Cada política tiene pruebas de contrato que cualquier implementación futura tiene que pasar (Liskov).
  - **GRASP:** `Actividad` es experta en su intervalo y en su grupo de opciones, y crea sus alternativas. Por eso la regla de que una alternativa se vincule siempre a la original vive en la entidad y no en el caso de uso.
  - **Rutas de propuestas:** ahora dependen solo de los métodos que usan (`Pick<…, 'ejecutar'>`). `ResolverPropuesta` se arma con los repositorios ampliados de actividades, y TypeScript no acepta esa instancia donde se espera la versión con los repositorios mínimos (segregación de interfaces).
  - **Bloqueos:** la regla de superposición bloquea la fila del viaje antes de leer las confirmadas, así dos confirmaciones simultáneas de actividades superpuestas no pasan las dos.
  - **`sumarMinutos` al paquete compartido:** se había creado en la API. Se movió cuando la web también lo necesitó, para no duplicar el cálculo.
  - **Formulario de alternativa:** arranca con el día, la hora y la duración de la original, porque las alternativas suelen competir por el mismo horario. Todo se puede cambiar.
  - **Recarga después de resolver:** si la respuesta trae `afectadas`, el store vuelve a pedir la lista de actividades para mostrar el estado nuevo de las demás opciones. Se descartó marcarlas como denegadas del lado del cliente, porque eso repetiría la política en el frontend.
- **Desvíos respecto del plan:**
  - La sección 5.6 decía que el listado anidaba las alternativas en su original. La API devuelve una lista plana en la que cada alternativa trae `alternativaDe` con el id y el título de la original, y el frontend las agrupa. Así el filtro por estado sigue funcionando cuando la original y sus alternativas están en estados distintos, y la misma vista sirve para la consulta de CU18. Se actualizó `PLAN.md`.
  - Se agregó el decorador `PropuestasConAgendaBloqueadaPrimero`, que el plan no preveía; se explica en el error siguiente.
- **Errores encontrados y corregidos:**
  - **Bloqueo mutuo:** si el Admin confirmaba al mismo tiempo dos opciones del mismo grupo, cada transacción bloqueaba su propuesta y esperaba la fila del viaje que tenía la otra. PostgreSQL cortaba una de las dos, que respondía 500 después de un segundo.
    - **Causa:** los bloqueos se tomaban en distinto orden.
    - **Arreglo:** el decorador hace que, dentro de la transacción de resolución, se bloquee la agenda del viaje antes de cargar la propuesta. Ahora la segunda confirmación espera, encuentra su opción ya denegada y responde 409 `TRANSICION_INVALIDA`.
    - **Por qué un decorador:** se armó en `contenedor.ts` para no modificar `ResolverPropuesta`. Se descartó sumar un método "antes de cargar" a `ReglaAlResolver`, porque cambiaría el contrato de F3 por una necesidad de infraestructura.
    - Lo cubren una prueba de integración y una unitaria del orden de los bloqueos.
  - **Duración:** el campo numérico de la duración entrega un número y el formulario lo trataba como texto, así que fallaba al enviar. Lo detectó la prueba de la vista.
  - **Texto del aviso:** el aviso de superposición sugería cambiar el horario también cuando el Admin confirmaba desde la lista, donde no hay formulario. Ahora, en la lista, sugiere cancelar primero la actividad que ocupa ese horario.
- **Verificación del criterio de terminado:**
  - `npm test` pasa 265 pruebas: 227 del backend y 38 del frontend. Entre ellas:
    - superposición con intervalos que se tocan en el borde, que se contienen, que se cruzan en parte y que pasan la medianoche;
    - solo cuentan las confirmadas: se puede proponer sobre el horario de una pendiente;
    - la alternativa de una alternativa queda vinculada a la original;
    - confirmar una opción deniega las demás pendientes del grupo, y denegar la original no afecta a las alternativas;
    - confirmar una actividad que choca con otra confirmada devuelve 409 y no cambia nada;
    - dos confirmaciones simultáneas de actividades superpuestas: solo una prospera. La prueba falla si se quita el bloqueo;
    - dos confirmaciones simultáneas de opciones del mismo grupo: una responde 200 y la otra 409;
    - contratos de las dos políticas y de los repositorios nuevos, en memoria y en Prisma;
    - CU26 con el endpoint común de desvoto.
  - `npm run lint` pasa sin errores. En un clon limpio también pasan `npm ci`, la compilación, las pruebas y el lint.
  - **Recorrido manual en Chromium:**
    - Tomás propone Kayak de 10:00 a 12:00 y, como alternativa, Trekking, que aparece anidada. También propone un Almuerzo a las 11:30.
    - Ana confirma Trekking y Kayak queda denegada. Al confirmar el Almuerzo, ve el aviso con el conflicto.
    - Tomás propone Bici a las 11:00, ve el conflicto y el formulario conserva lo cargado. La vuelve a proponer a las 12:00 y se acepta.
    - Tomás vota y desvota la Bici.

## 2026-09-24 01:37 — Commit y push de F4

- **Acción:** con autorización del usuario, se hace commit de F4 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada de cierre de F4, más esta entrada en `LOG.md`.

## 2026-09-24 01:39 — Inicio de F5: itinerario, cronograma y mapa

- **Acción:** comienza la fase F5 de `PLAN.md`: consultar el cronograma (CU16, RN-C1 a RN-C4) y el mapa del día con marcadores numerados y recorrido (CU17, RN-M1 a RN-M8), y ver una actividad en el mapa (CU18). Se aplican P19, P20 y P21.

## 2026-09-24 01:46 — F5 terminada: itinerario, cronograma y mapa

- **Acción:** se implementa F5 completa, backend y frontend.
- **Archivos creados:**
  - **Módulo `itinerario` del backend:**
    - dominio: `recorrido.ts` (`ProveedorRecorrido` y `RecorridoEnLineaRecta`) y `puertos.ts` (`ConsultaItinerario`);
    - casos de uso: `casosDeUsoItinerario.ts` (`ConsultarCronograma` y `ConsultarMapa`);
    - infraestructura: `prisma.ts` (`ConsultaItinerarioPrisma`);
    - rutas: `itinerario.rutas.ts`.
  - **Pruebas del backend:** `casosDeUsoItinerario.test.ts`, `recorrido.contrato.ts` con `recorrido.test.ts`, e `itinerario.bd.test.ts`.
  - **Frontend:**
    - cliente `itinerario.ts` y composable `useMapaDelDia`;
    - componentes `MapaActividades`, `SelectorDia`, `AvisoSinActividades`, `PanelActividad` y `DiaCronograma`;
    - vistas `MapaVista` y `CronogramaVista`;
    - utilidades de fechas (`hoyDelDispositivo`, `diasEntre`, `nombreDelDia`);
    - pruebas de `MapaActividades`, `MapaVista`, `CronogramaVista` y de las utilidades.
- **Archivos modificados:**
  - Paquete compartido: `contratos.ts` (tipos del cronograma y del mapa) y `esquemas.ts` (`esquemaConsultaMapa`).
  - Backend:
    - `viaje.ts` (`diaInicialDelMapa`), `viajes/dominio/puertos.ts` (`LectorDeViajes`) y `viajes/infraestructura/prisma.ts` (`obtener` sin bloqueo);
    - `contenedor.ts` y `app.ts`;
    - las pruebas de `Viaje` y los soportes y contratos de repositorios.
  - Frontend: `main.ts`, el router y el menú del viaje.
  - Documentación: `docs/api.md` y `PLAN.md` (sección 5.7).
- **Decisiones:**
  - **`LectorDeViajes`:** el mapa necesita la regla del día inicial, que vive en `Viaje` (experto en información). Para no cargar el agregado con bloqueo en una consulta, se agregó este puerto de lectura sin bloqueo, separado de `RepositorioViajes` (segregación de interfaces). Lo implementan los repositorios de viajes en Prisma y en memoria, y tiene prueba de contrato. Se descartó mover la regla a `RangoFechas`, porque "día inicial del mapa" es un concepto del viaje y no de cualquier rango.
  - **`ProveedorRecorrido` asíncrono:** el trazado por calles del Release 4 va a consultar un servicio externo, así que la interfaz ya es asíncrona y no hará falta cambiarla. Su contrato exige empezar y terminar en las actividades y pasar por todas en orden, lo que admite puntos intermedios.
  - **Una sola consulta de actividades confirmadas:** el mapa lee todas las del viaje y filtra el día en memoria, porque también necesita la lista de días con actividad. Con el tamaño de un viaje, dos consultas no aportan nada.
  - **"Hoy":** la web lo calcula con la fecha local del dispositivo y lo manda en cada pedido del mapa (P19, D17). El cronograma lo usa para desplazarse hasta el día actual.
  - **Marcadores numerados:** son íconos de texto de Leaflet, por el mismo motivo que en F3 (las imágenes de los íconos se rompen al empaquetar).
  - **Día elegido en la dirección:** el día queda como `?dia=` para poder compartir el enlace o volver atrás.
  - **Actividad no confirmada en el mapa:** si se abre `?actividad=` con una actividad que no está confirmada, se abre su día y se muestra el panel aclarando que no está en el recorrido. Se descartó responder con un error, porque el enlace puede venir de una actividad que se canceló después.
- **Desvío respecto del plan:** el cronograma devuelve una lista de alojamientos por noche en lugar de uno solo. Nada impide confirmar dos alojamientos para la misma noche, y con un único valor uno quedaría oculto. Se actualizó la sección 5.7 de `PLAN.md`.
- **Verificación del criterio de terminado:**
  - `npm test` pasa 301 pruebas: 255 del backend y 46 del frontend. Entre ellas:
    - `Viaje.diaInicialDelMapa()` con hoy dentro del viaje, con y sin actividades; hoy antes y después del viaje con actividades confirmadas; y un viaje sin actividades confirmadas;
    - cronograma con días vacíos, orden por horario, solo confirmadas y el alojamiento de cada noche sin contar el día de salida;
    - integración de `GET …/mapa`: aviso del día vacío, cambio de día, día inicial, validación de parámetros y día fuera del viaje;
    - contrato de `ProveedorRecorrido` y del puerto nuevo de lectura;
    - prueba de componente de `MapaActividades`: un marcador numerado por actividad y una polilínea con las coordenadas en orden;
    - `MapaVista` con `?actividad=`: abre el día de la actividad con su panel.
  - `npm run lint` pasa sin errores.
  - **Recorrido manual en Chromium:**
    - el cronograma muestra los cinco días, las actividades del día 11 en orden, la noche en el hostel y la leyenda de los días vacíos;
    - "Ver en el mapa" abre el día 11 con los marcadores 1, 2 y 3, la línea del recorrido y el panel del Almuerzo;
    - el día 13 muestra el aviso y queda en la dirección;
    - un clic en un marcador abre su panel;
    - sin día elegido, el mapa abre el primer día con actividades.

## 2026-09-24 01:48 — Commit y push de F5

- **Acción:** con autorización del usuario, se hace commit de F5 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada de cierre de F5, más esta entrada en `LOG.md`.

## 2026-09-24 01:49 — Inicio de F6: chat en tiempo real

- **Acción:** comienza la fase F6 de `PLAN.md`: chat del viaje con historial paginado y mensajes en tiempo real por Socket.IO (CU19, RN-X5), y avisos de baja de participante y de traspaso de Admin entregados por `NotificadorViaje` a partir de los eventos de dominio de F2 (RN-E4, D11).

## 2026-09-24 02:04 — F6 terminada: chat en tiempo real

- **Acción:** se implementa F6 completa, backend y frontend.
- **Dependencias nuevas:** `socket.io` en la API; `socket.io-client` en la web y, para las pruebas, en la API.
- **Archivos creados:**
  - **Módulo `chat` del backend:**
    - dominio: `mensaje.ts` (entidad `Mensaje`) y `puertos.ts` (`RepositorioMensajes`, `ConsultaMensajes`, `ConsultaParticipacion`, `ConsultaSaldosPendientes` y `NotificadorViaje`);
    - casos de uso: `casosDeUsoChat.ts` (`UnirseAlChat`, `EnviarMensaje`, `ConsultarMensajes` y `ReenviarEventosDelViaje`);
    - infraestructura: `prisma.ts`, `participacion.ts` (adaptador sobre la consulta de viajes) y `socketIO.ts` (gateway y `NotificadorViajeSocketIO`);
    - rutas: `chat.rutas.ts`.
  - **Backend, conexión con el servidor:** `src/tiempoReal.ts`, que conecta Socket.IO al servidor HTTP.
  - **Pruebas del backend:** `chat.test.ts`, `notificadorViaje.contrato.ts` con `notificadorViaje.test.ts` (en memoria y sobre Socket.IO) y `chat.bd.test.ts`.
  - **Frontend:**
    - cliente `chat.ts` (interfaz `ClienteChat` y adaptador de Socket.IO) y store `chat`;
    - componentes `ListaMensajes` y `CampoMensaje`, y vista `ChatVista`;
    - pruebas del store, de la vista y de `ViajeLayout`.
- **Archivos modificados:**
  - Paquete compartido: `contratos.ts` (mensajes, avisos y tipos de los eventos de Socket.IO) y `esquemas.ts` (`esquemaMensajeNuevo` y `esquemaConsultaMensajes`).
  - Backend: `servidor.ts`, `contenedor.ts` y `app.ts`; soportes en memoria, escenarios y contratos de repositorios.
  - Frontend: `main.ts`, el router, `ViajeLayout` (conexión y aviso de baja), `ViajesVista` (aviso), el store de viaje (`aviso`, `refrescar` y `cerrarPorBaja`) y los clientes falsos de las pruebas.
  - Documentación: `docs/api.md` y `PLAN.md` (sección 5.8).
- **Decisiones:**
  - **`NotificadorViaje` como Observer:** `ReenviarEventosDelViaje` se suscribe a los eventos de baja y de traspaso que publica el módulo de viajes desde F2. Ese módulo no se modificó y sigue sin conocer el chat. El notificador tiene un contrato que cumplen la implementación sobre Socket.IO y la de memoria (Liskov).
  - **`conservaAccesoSaldos`:** se calcula con saldos pendientes a favor o en contra (RN-E6) mediante una consulta nueva sobre `deuda`. El dato `bajaConDeuda` del evento no alcanza, porque a un acreedor también le quedan saldos pendientes.
  - **Seguridad del canal:**
    - el handshake exige el `Origin` de la aplicación y una sesión vigente;
    - cada evento vuelve a validar la sesión, así un cierre de sesión corta la conexión abierta;
    - el id del viaje que llega por socket se valida antes de consultar la base.
  - **Salas:** una por viaje (`viaje:<id>`) y una por usuario (`usuario:<id>`). La del usuario permite avisarle la baja en todas sus conexiones y sacarlo de la sala del viaje.
  - **Paginación:** el cursor es `(enviado_en, id)` y no solo la fecha, para no repetir ni perder mensajes del mismo instante.
  - **Conexión en el frontend:** se abre al entrar a un viaje en `ViajeLayout` y no solo en la vista del chat. Así los avisos de baja y de traspaso llegan desde cualquier sección, como pide la sección 4 del plan.
  - **Mensajes optimistas:** el mensaje propio se muestra enseguida con un `idTemporal` (un UUID) y se reemplaza con la confirmación o con el eco de la sala, lo que llegue primero, sin duplicarse. Solo se reemplaza un mensaje con el mismo `idTemporal` y el mismo autor.
  - **Reconexión:** al reconectarse, el cliente vuelve a unirse a la sala y pide la última página del historial, para recuperar lo que se envió mientras la conexión estaba cortada.
  - **Límite de espera:** unirse y enviar esperan hasta 10 segundos la confirmación. Si no llega, el mensaje queda marcado como no enviado y el error se muestra en la pantalla.
- **Desvío respecto del plan:** Socket.IO usa solo el transporte WebSocket. En el recorrido manual, el servidor rechazó la conexión con `ORIGEN_NO_PERMITIDO`. El primer pedido del transporte de sondeo es un GET del mismo origen, y el navegador no le agrega el encabezado `Origin`. El handshake de WebSocket, en cambio, siempre lo trae. Se descartó relajar la verificación cuando falta el encabezado, porque dejaría pasar conexiones de otros sitios sin comprobar su origen. Las pruebas de integración no lo detectaron porque el cliente de Node agrega el encabezado en todos los pedidos. Se agregó una prueba que verifica que el sondeo se rechaza. Se actualizó la sección 5.8 de `PLAN.md`.
- **Errores encontrados y corregidos:**
  - Con la sesión cerrada, el servidor cortaba la conexión antes de responder, y el cliente no recibía la confirmación con `NO_AUTENTICADO`. Ahora responde primero y corta después. Lo detectó la prueba de integración.
  - La vista del chat pedía el historial al montarse, a veces antes de que el chat tuviera el viaje abierto. Ahora lo pide cuando el viaje está disponible. Lo detectó la prueba de la vista.
- **Dependencias con avisos de seguridad:** `npm audit` informa cuatro avisos altos en `mysql2` y `deepmerge-ts`. Llegan por la herramienta de línea de comandos `prisma` y ya estaban antes de esta fase. El arreglo automático propone bajar Prisma a la versión 6, un cambio incompatible, así que no se aplicó y queda para consultarlo con el usuario.
- **Verificación del criterio de terminado:**
  - `npm test` pasa 336 pruebas: 282 del backend y 54 del frontend. Entre ellas, pruebas de integración con `socket.io-client` que verifican:
    - dos participantes del mismo viaje reciben el mismo mensaje;
    - un usuario de otro viaje no puede unirse ni enviar, y no recibe nada;
    - la conexión sin cookie, con una cookie inválida, con otro `Origin` o por sondeo se rechaza;
    - el participante eliminado recibe `viaje:membresia-finalizada` y deja de recibir mensajes;
    - quien sale con saldos pendientes conserva el acceso a saldos;
    - el traspaso emite `viaje:admin-cambiado`;
    - el historial pagina hacia atrás sin repetir mensajes;
    - el contenido se valida y la sesión cerrada corta la conexión.
  - Otras pruebas:
    - contrato de `NotificadorViaje`;
    - contratos de los repositorios de mensajes y de saldos pendientes, incluida la paginación con mensajes del mismo instante.
  - `npm run lint` pasa sin errores. Se repitieron cuatro veces seguidas las pruebas que dependen de tiempos, sin fallas.
  - **Recorrido manual en Chromium con dos sesiones y el proxy de Vite:**
    - Ana escribe y Tomás recibe el mensaje en vivo; Ana ve el suyo confirmado.
    - Tomás responde y Ana lo recibe; al recargar, el historial se conserva.
    - Ana transfiere la administración y Tomás pasa a ver las acciones de Admin sin volver a abrir el viaje.
    - Tomás elimina a Ana, que vuelve a su lista de viajes con el aviso "El Admin te quitó de «Bariloche 2026»."

## 2026-09-24 02:07 — Commit y push de F6

- **Acción:** con autorización del usuario, se hace commit de F6 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada de cierre de F6, más esta entrada en `LOG.md`.
- **Pendiente:** el usuario pidió una explicación de los avisos de seguridad de las dependencias; la decisión sobre ellos queda abierta.

## 2026-09-24 02:16 — Decisión sobre los avisos de seguridad de las dependencias de Prisma

- **Acción:** se le explicó al usuario para qué se usa Prisma y qué problemas hubo con él.
  - **Usos:** esquema y migraciones de la base; repositorios y consultas de cada módulo; transacciones con `UnidadDeTrabajoPrisma`; semilla de datos de ejemplo; preparación de la base de pruebas.
  - **Problemas encontrados, todos resueltos dentro de la capa de infraestructura:**
    - avisos de `npm audit`;
    - `migrate reset` bloqueado para agentes de IA sin consentimiento explícito;
    - bloqueo de filas escrito a mano con `SELECT … FOR UPDATE`, porque Prisma no lo ofrece;
    - restricciones `CHECK` y el índice parcial de Admin único agregados a mano en la migración;
    - conversiones de `bigint` a número y de `Date` a fechas y horas en texto;
    - npm marca como última versión la 8.0, que todavía es candidata.
- **Decisión del usuario:** no tocar las dependencias ahora y evaluar la actualización cuando salga Prisma 8 estable.
- **Motivo:** `mysql2` y `deepmerge-ts` llegan por la herramienta de línea de comandos `prisma`, que solo corre en desarrollo. La aplicación en funcionamiento usa `@prisma/client` con el adaptador de PostgreSQL y no los ejecuta.
- **Alternativas descartadas:**
  - Forzar versiones corregidas con `overrides`: `deepmerge-ts` cambia de versión mayor y podría romper Prisma.
  - Replantear D4: habría que reescribir la infraestructura de F1 a F6.
- **Archivos:** esta entrada en `LOG.md`. Se incluye en el próximo commit que el usuario autorice.

## 2026-09-24 02:18 — Inicio de F7: gastos y deudas

- **Acción:** comienza la fase F7 de `PLAN.md`. Incluye:
  - anotar gastos con pagador, deudores y división en partes iguales o arbitraria (CU20, RN-G1 a RN-G6, P12 a P15);
  - actualizar la deuda neta de cada par con compensación y filas bloqueadas (D18);
  - consultar las deudas como deudor y como acreedor (CU21, CU22);
  - dar acceso solo a saldos a quien dejó el viaje con saldos pendientes (RN-E6, P18).

## 2026-09-24 02:38 — F7 terminada: gastos y deudas

- **Acción:** se implementa F7 completa, backend y frontend.
- **Archivos creados:**
  - **Paquete compartido:** `dinero.ts` (`repartirEnPartesIguales`), que usan `Dinero.repartir()` en la API y la vista previa del formulario en la web.
  - **Módulo `gastos` del backend:**
    - dominio: `division.ts` (`EstrategiaDivision`, `DivisionEnPartesIguales` y `DivisionArbitraria`), `gasto.ts` (`Gasto`, que crea sus partes), `deuda.ts` (`Deuda` con `sumar()` y `compensarCon()`) y `puertos.ts`;
    - casos de uso: `casosDeUsoGastos.ts` (`AnotarGasto`, `ConsultarGastos` y `ConsultarDeudas`);
    - infraestructura: `prisma.ts`, con el repositorio de deudas que crea los pares faltantes y los bloquea en orden;
    - rutas: `gastos.rutas.ts` (categorías, gastos y deudas).
  - **Semilla:** `prisma/semilla.ts`, con los datos que antes estaban en `seed.ts`, para cargarlos también en la base de prueba.
  - **Pruebas del backend:**
    - `gastos.test.ts`, `casosDeUsoGastos.test.ts` y `estrategiaDivision.contrato.ts` con su prueba;
    - `gastos.bd.test.ts` e `invarianteSemilla.bd.test.ts`;
    - el soporte `invarianteSaldos.ts`.
  - **Frontend:**
    - cliente `gastos.ts` y store `gastos`;
    - componentes `SelectorPagador`, `SelectorDeudores`, `SelectorModoDivision`, `TablaPartes`, `TarjetaGasto` y `FilaSaldo`;
    - vistas `GastosVista`, `GastoFormularioVista` y `SaldosVista`;
    - pruebas de `SelectorDeudores`, del formulario y de los saldos.
- **Archivos modificados:**
  - Paquete compartido: `contratos.ts` (`TipoAcceso`, `miAcceso` en el resumen y el detalle del viaje, y los tipos de gastos y deudas) y `esquemas.ts` (`esquemaGastoNuevo` y `esquemaConsultaDeudas`).
  - Backend:
    - `viaje.ts` (`tipoDeAcceso` y `Membresia.tipoDeAcceso()`, `monedaCodigo`), puertos, casos de uso (`ConsultarAcceso`), consultas y rutas del módulo de viajes;
    - el middleware `accesoSaldos` y el tipo de `req.acceso`;
    - `dinero.ts`, `app.ts`, `contenedor.ts` y `prisma/seed.ts`;
    - el módulo de chat, que ahora usa el puerto de saldos pendientes del módulo de viajes;
    - los soportes en memoria, los escenarios, los contratos de repositorios y la prueba de viajes.
  - Frontend: `ViajeLayout`, `ViajesVista`, `DialogoSalir`, el router, `main.ts`, los clientes falsos y las pruebas del layout y de participantes.
  - Documentación: `docs/api.md` y `PLAN.md` (sección 5.9).
- **Decisiones:**
  - **Estrategias de división:** `EstrategiaDivision` tiene dos implementaciones (Strategy). `contenedor.ts` elige la del modo pedido con una tabla, así un modo nuevo es una clase y una entrada, sin tocar `Gasto` ni `AnotarGasto` (abierto/cerrado). Las dos cumplen un contrato común: una parte por deudor, en orden, que suman el total.
  - **Compensación (P15):** `Deuda.compensarCon()` resta a las dos deudas del par el menor de sus montos. `AnotarGasto` suma la parte a la deuda del deudor y después la compensa con la opuesta. El resultado es el mismo que compensar primero y sumar después, con una sola regla en la entidad.
  - **Bloqueo de deudas (D18):**
    - el repositorio crea en cero los pares que faltan (`INSERT … ON CONFLICT DO NOTHING`) y después bloquea las filas con `SELECT … FOR UPDATE` ordenadas por id;
    - bloquear siempre en el mismo orden evita que dos gastos simultáneos se esperen en cruz;
    - se agregó una prueba que falla si se quita el bloqueo.
  - **Acceso solo a saldos (RN-E6):**
    - la regla vive en una función del dominio que usan `Membresia.tipoDeAcceso()` y las consultas de la lista y del detalle, así no se repite;
    - las rutas del detalle y de las deudas reciben su propia guarda (`accesoSaldos`) y el resto sigue exigiendo participar;
    - `ConsultaSaldosPendientes`, creada en F6 dentro del chat, pasó al módulo de viajes, que es quien decide el acceso; el chat ahora la importa de ahí.
  - **Invariante del saldo neto por par:** se calcula desde `gasto_parte` y `pago` y se compara con `deuda`. También verifica que no haya saldos negativos ni dos deudas con saldo en el mismo par. Corre sobre la semilla y después de cada prueba de gastos, y una prueba muestra que detecta un saldo alterado.
  - **Formulario:**
    - paga quien anota y no hay nadie elegido al empezar (P12, P13);
    - la categoría no se preselecciona (RN-G1);
    - en partes iguales se muestra el reparto antes de guardar, con el mismo cálculo que la API;
    - en arbitraria se muestran la suma y lo que falta o sobra mientras se escribe.
  - **Destino al perder el acceso completo:** con saldos pendientes, quien sale o es eliminado queda en la sección de saldos con un aviso; sin saldos, vuelve a la lista de viajes. La lista marca esos viajes como "Solo saldos" y los abre directo en esa sección.
- **Desvíos respecto del plan:**
  - Las partes de un gasto se devuelven de mayor a menor monto, porque `gasto_parte` no guarda el orden de elección. Se actualizó la sección 5.9 de `PLAN.md`.
  - El historial de pagos en las deudas queda para F8, junto con los pagos, como indica su fase.
- **Errores encontrados y corregidos:**
  - **Pares con datos de más:** el repositorio de deudas en Prisma recibía los pares con el monto incluido y fallaba al crearlos. Lo detectó la prueba de integración y se agregó el caso al contrato, que la implementación en memoria no detectaba.
  - **Prueba de F2 desactualizada:** esperaba que un eliminado con deuda perdiera todo acceso; con RN-E6 conserva el detalle y los saldos, y se actualizó.
  - **Carrera al salir:** el diálogo de salida mandaba a la lista de viajes mientras el aviso por socket mandaba a saldos. Ahora los dos llevan al mismo destino según el acceso que queda, con una prueba.
  - **Saldos viejos:** la vista mostraba los de una visita anterior hasta que llegaban los nuevos; ahora muestra "Cargando…" hasta tenerlos.
- **Entorno:** el contenedor de la sesión se reinició y hubo que volver a levantar Docker y las bases.
- **Verificación del criterio de terminado:**
  - `npm test` pasa 392 pruebas: 326 del backend y 66 del frontend. Entre ellas:
    - reparto con resto (1000 entre 3 da 334, 333 y 333);
    - división arbitraria cuya suma no coincide, con el detalle de la diferencia;
    - pagador fuera de los elegidos y parte del pagador sin deuda;
    - compensación: si A le debe 10.000 a B y paga un gasto con parte de B de 4.000, queda A → B 6.000;
    - gastos simultáneos sobre el mismo par con el saldo correcto;
    - un exparticipante con saldos accede al detalle y a `GET …/deudas`, y recibe 403 en el resto; el acreedor también conserva el acceso;
    - contrato de `EstrategiaDivision`;
    - invariante del saldo neto sobre la semilla y después de cada prueba de gastos;
    - prueba de componente de `SelectorDeudores` con el estado inicial vacío y el botón que alterna.
  - `npm run lint` pasa sin errores.
  - **Recorrido manual en Chromium con tres usuarios:**
    - Ana anota una cena de $10 entre los tres, con la vista previa $3,34, $3,33 y $3,33.
    - Tomás anota nafta de $60 dividida a mano, viendo lo que falta asignar.
    - Los saldos de Ana muestran que debe $36,67 a Tomás, ya compensado, y que Luis le debe $3,33.
    - Luis sale con deuda y queda en la sección de saldos, con el menú reducido y el viaje marcado como "Solo saldos" en su lista.

## 2026-09-24 02:41 — Commit y push de F7

- **Acción:** con autorización del usuario, se hace commit de F7 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada de cierre de F7, la entrada sobre los avisos de seguridad de Prisma y esta entrada en `LOG.md`.

## 2026-09-24 02:41 — Inicio de F8: pagos

- **Acción:** comienza la fase F8 de `PLAN.md`: registrar pagos parciales o totales de una deuda propia (CU23, RN-P1 a RN-P6, P17), con la fila de deuda bloqueada (D18), y mostrar el historial de pagos en los saldos del deudor y del acreedor.

## 2026-09-24 02:50 — F8 terminada: pagos

- **Acción:** se implementa F8 completa, backend y frontend.
- **Archivos creados:**
  - Backend: `pagos.bd.test.ts`.
  - Frontend:
    - vista `PagoVista` y componente `AvisoExcedeDeuda`;
    - pruebas de `PagoVista`.
- **Archivos modificados:**
  - Paquete compartido: `contratos.ts` (`PagoRegistrado`, `RespuestaPago` y `pagos` en `DeudaVista`) y `esquemas.ts` (`esquemaPagoNuevo`).
  - Backend:
    - `deuda.ts` (`Deuda.registrarPago()` y los pagos sin guardar);
    - puertos, casos de uso (`RegistrarPago`), infraestructura Prisma y rutas del módulo de gastos;
    - `app.ts` y `contenedor.ts`;
    - los soportes en memoria, los contratos de repositorios y las pruebas unitarias de gastos.
  - Frontend: el cliente y el store de gastos, `FilaSaldo` (historial y acciones), `SaldosVista`, el router, `ViajeLayout` (la pantalla de pago también vale con acceso solo a saldos) y los clientes falsos.
  - Documentación: `docs/api.md`.
- **Decisiones:**
  - **Pago dentro del agregado:** el pago es parte del agregado `Deuda` (la relación "resta" del modelo conceptual). `Deuda.registrarPago()` aplica las reglas y guarda el pago como pendiente; el repositorio persiste el saldo y los pagos juntos, en la misma transacción.
  - **Reglas que aplica `Deuda`:** quien registra el pago tiene que ser el deudor (P17), el monto tiene que ser mayor que cero y no puede superar el saldo (RN-P4, con el saldo en los detalles). La API ya usa a quien llama como deudor; la regla del dominio protege a cualquier otro uso.
  - **Bloqueo (D18):** `obtenerParaPagar` toma la fila de la deuda con `SELECT … FOR UPDATE`. Dos pagos simultáneos se ordenan y el segundo ve el saldo actualizado. Se agregó una prueba que falla si se quita el bloqueo.
  - **Acceso:** `POST …/pagos` usa la misma guarda que las deudas (RN-E6), así un exparticipante con saldo pendiente puede pagar. Al saldar, pierde también ese acceso.
  - **Pantalla de pago:**
    - muestra lo que se debe (RN-P2) y avisa mientras se escribe si el monto supera la deuda, sin dejar pagar;
    - el botón "Pagar el total" completa el monto;
    - si la API responde que el pago excede la deuda porque otro pago cambió el saldo, vuelve a leer las deudas y muestra el saldo nuevo;
    - al terminar vuelve a los saldos con una confirmación que se muestra una sola vez.
  - **Historial (RN-P6):** cada fila de saldo muestra sus pagos, desde los dos lados, con quién los registró y cuándo. El botón "Pagar" aparece solo en las deudas propias.
- **Errores encontrados y corregidos:**
  - **Pago total:** en el recorrido manual, pagar el total dejaba la pantalla sin navegar. El pago vaciaba la lista de deudas antes de armar la confirmación, que buscaba el nombre en esa deuda. Ahora el nombre se toma antes de pagar, y se agregó la prueba del pago total que faltaba.
  - **Código cortado:** una edición de la vista de pago cortó el comienzo de una función. Lo detectó la compilación y se restauró.
- **Verificación del criterio de terminado:**
  - `npm test` pasa 415 pruebas: 341 del backend y 74 del frontend. Entre ellas:
    - pago parcial;
    - pago exacto: el saldo queda en cero y la deuda desaparece de las dos listas;
    - pago mayor que la deuda: 422 sin cambios en la base;
    - pago registrado por alguien que no es el deudor: rechazado;
    - pago de un exparticipante con saldo pendiente: aceptado, y al saldar pierde el acceso;
    - dos pagos simultáneos que juntos superan el saldo: uno se registra y el otro recibe 422;
    - el pago aparece en el historial de los dos con quién lo registró y cuándo;
    - la invariante del saldo neto sigue pasando después de cada prueba.
  - `npm run lint` pasa sin errores.
  - **Recorrido manual en Chromium:**
    - Tomás debe $1.000 a Ana; al escribir $1.200 ve el aviso y el botón se deshabilita.
    - Paga $400 y ve "Todavía le debés $600,00 a Ana"; el pago aparece en el historial de los dos.
    - Ana no tiene botón para pagar lo que le deben.
    - Tomás paga el total con "Pagar el total" y la deuda queda saldada.

## 2026-09-24 02:52 — Commit y push de F8

- **Acción:** con autorización del usuario, se hace commit de F8 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada de cierre de F8, más esta entrada en `LOG.md`.

## 2026-09-24 02:53 — Inicio de F9: pruebas de punta a punta y cierre

- **Acción:** comienza la fase F9 de `PLAN.md`. Incluye:
  - pruebas de Playwright en `e2e/` para los seis flujos previstos, con el script `e2e` de raíz;
  - `docs/api.md` completo;
  - la revisión de la tabla de trazabilidad, verificando que cada caso de uso de la sección 1 y cada regla de la sección 6 aparezcan en el nombre de al menos una prueba.

## 2026-09-24 03:00 — F9 terminada: pruebas de punta a punta y cierre

- **Acción:** se implementa F9 completa.
- **Dependencia nueva:** `@playwright/test` 1.63 en la raíz.
- **Archivos creados:**
  - **Configuración:** `e2e/playwright.config.ts` y `e2e/tsconfig.json`.
  - **Soporte en `e2e/soporte/`:**
    - `constantes.ts`;
    - `prepararBase.ts` y `prepararTodo.ts`: crean la base `viajes_e2e`, aplican las migraciones, la vacían y cargan los catálogos;
    - `fixtures.ts`: viajeros con sesión propia, preparación de datos por la API, mapa sin teselas y Nominatim simulado.
  - **Flujos:** `grupo.spec.ts`, `actividades.spec.ts`, `itinerario.spec.ts`, `gastos.spec.ts`, `chat.spec.ts` y `administracion.spec.ts`.
  - **Trazabilidad:** `apps/api/test/unitarias/trazabilidad.test.ts`.
- **Archivos modificados:**
  - `package.json`: script `e2e` y chequeo de tipos de `e2e/` en `lint`.
  - `eslint.config.js`, `.env.example` y `README.md`.
  - Backend: `config.ts` (`REGISTROS_POR_HORA`), `seguridad.ts`, `auth.rutas.ts` y `app.ts`.
  - Frontend: `vite.config.ts` (`API_URL` para el proxy).
  - Nombres de algunas pruebas unitarias y dos pruebas nuevas (RN-R2 y RN-X6).
  - Documentación: `docs/api.md` y `PLAN.md` (revisión de la tabla de trazabilidad).
- **Decisiones:**
  - **Entorno propio:** las pruebas de punta a punta levantan su propia API (puerto 3100) y su propia web (puerto 5273) contra la base `viajes_e2e`, creada en el mismo servidor que la de Vitest. Así no chocan con `npm run dev` ni con `npm test`, que vacía su propia base. Se descartó usar la base de prueba, porque correr las dos suites a la vez borraría datos de la otra.
  - **Datos de preparación:** cada flujo crea usuarios nuevos y prepara por la API lo que no es parte de lo que prueba (por ejemplo, la actividad ya confirmada). Recorre en el navegador solo el flujo pedido.
  - **Servicios externos:** las teselas del mapa se bloquean y Nominatim devuelve siempre un lugar, así el flujo de proponer una actividad elige la ubicación del buscador sin depender de la red.
  - **Límite de registros configurable:** `REGISTROS_POR_HORA` (10 por defecto, D6). Solo lo suben las pruebas de punta a punta, que registran unos doce usuarios desde la misma IP.
  - **Navegador:** Playwright usa la versión estable vigente (D23). Para un Chromium ya instalado en otra ruta, como en esta sesión, se indica con `E2E_CHROMIUM`; en cualquier otra máquina alcanza con `npx playwright install chromium`.
  - **Contextos:** los contextos de navegador que abre cada prueba se cierran al terminarla.
  - **Trazabilidad automática:** una prueba de Vitest lee la tabla de la sección 1 y las reglas de la sección 6 de `PLAN.md`, y falla si algún identificador no aparece en el nombre de al menos una prueba. Reconoce rangos como "RN-G1 a RN-G6". Al medirla por primera vez faltaban siete identificadores:
    - CU13 a CU15, RN-A3 y RN-B2 ya tenían pruebas sin el identificador en el nombre; se renombraron;
    - RN-R2 (el Admin resuelve sin umbral de votos) y RN-X6 (los montos van en la moneda del viaje) no tenían pruebas propias; se agregaron.
- **Errores encontrados y corregidos:** una línea de `auth.rutas.ts` quedó sin el formato de Prettier y el lint lo detectó.
- **Salida de la consola:** al cerrar un contexto, el proxy de Vite registra `ECONNRESET` porque el navegador corta el WebSocket del chat. Es esperable y no afecta a las pruebas.
- **Verificación del criterio de terminado:**
  - `npm run e2e` pasa los seis flujos en Chromium, en tres corridas seguidas sin fallas:
    - registrarse, crear un grupo y agregar a un viajero;
    - proponer una actividad que se superpone, ajustar el horario y guardarla;
    - confirmarla y verla en el cronograma y en el mapa;
    - anotar un gasto con división arbitraria y pagar parte de la deuda;
    - conversar en el chat desde dos sesiones;
    - transferir la administración y salir del grupo.
  - Cada caso de uso de la sección 1 y cada regla de la sección 6 aparecen en el nombre de al menos una prueba; lo verifica la prueba de trazabilidad.
  - `npm test` pasa 419 pruebas (345 del backend y 74 del frontend) y `npm run lint` pasa sin errores.
  - `docs/api.md` documenta todos los endpoints del código, con los códigos de error generales, y la tabla de trazabilidad quedó revisada.

## 2026-09-24 10:58 — Commit y push de F9

- **Acción:** con autorización del usuario, se hace commit de F9 y push a `claude/elegant-maxwell-60322c`.
- **Archivos:** los de la entrada de cierre de F9, más esta entrada en `LOG.md`.

## 2026-09-24 17:06 — Pull request del MVP

- **Acción:** a pedido del usuario, se abre un pull request con todo el MVP (F0 a F9).
- **Rama base:** el repositorio tenía una sola rama, `claude/elegant-maxwell-60322c`, que además era la principal, así que no había base contra la cual comparar. Con acuerdo del usuario se creó `main` en el commit `283a81a` ("Actualizar diagramas con las decisiones del plan"), el último antes del código, para que el PR muestre toda la implementación. Se descartó basarla en el primer commit (`f11f1b5`), que habría mezclado en el PR los ajustes del plan y de los diagramas.
- **Archivos:** esta entrada en `LOG.md`.

## 2026-09-24 17:15 — Integración continua con GitHub Actions

- **Acción:** a pedido del usuario, se agrega un flujo de CI para que el PR corra las verificaciones en GitHub. Hasta ahora el repositorio no tenía ninguno y las pruebas solo se corrían a mano.
- **Archivos:** `.github/workflows/ci.yml` (nuevo), `README.md` (sección de pruebas) y esta entrada en `LOG.md`.
- **Decisiones:**
  - **Cuándo corre:** en cada push y en cada pull request. Un push nuevo a la misma rama cancela la corrida anterior.
  - **Tres trabajos en paralelo:** lint y tipos, pruebas de Vitest y pruebas de punta a punta. Así un fallo indica enseguida qué parte se rompió. Se descartó un único trabajo con todos los pasos, que sería más lento y mostraría un solo resultado.
  - **Base de datos:** los trabajos de pruebas levantan PostgreSQL 16 como servicio, con el mismo usuario, base (`viajes_test`) y puerto (5433) que `db-test` de `docker-compose.yml`. Así no hace falta ninguna variable de entorno nueva, y `viajes_e2e` se crea sola como en local.
  - **Versiones:** Node 22 (el mínimo de `engines`) y la versión vigente de cada acción (`checkout`, `setup-node` y `upload-artifact`, todas en v7). Los permisos del token quedan en solo lectura.
  - **Informe de Playwright:** si fallan las pruebas de punta a punta, se guardan `playwright-report/` y `test-results/` como artefacto durante siete días.
- **Verificación:**
  - `actionlint` no marca errores y Prettier acepta el formato.
  - En un clon limpio con `CI=true` se repitieron los pasos del flujo contra la base de prueba: pasan `npm ci`, `npm run lint`, `npm test` (345 pruebas del backend y 74 del frontend) y `npm run e2e` (seis flujos).
  - Queda pendiente ver la primera corrida en GitHub, después del push.

## 2026-09-24 17:24 — CI: push solo a main

- **Acción:** a pedido del usuario, el flujo de CI deja de dispararse con cada push y lo hace solo con los push a `main`. Los pull requests lo siguen disparando.
- **Motivo:** en la primera corrida, cada push a la rama del PR disparó dos corridas iguales sobre el mismo commit, una por el push y otra por el pull request. El grupo de concurrencia no las unificaba, porque cada evento usa una referencia distinta. Ahora las ramas se verifican a través de su PR y `main` después de cada merge.
- **Alternativa descartada:** dejar solo el disparo por pull request, que habría dejado sin verificar lo que llega a `main`.
- **Archivos:** `.github/workflows/ci.yml`, `README.md` (el párrafo del CI) y esta entrada en `LOG.md`.
- **Verificación:** `actionlint` y Prettier sin errores.

## 2026-09-24 18:18 — Merge del PR del MVP a main

- **Acción:** a pedido del usuario, se mergea el pull request #1 (`claude/elegant-maxwell-60322c` hacia `main`) con todo el MVP, de F0 a F9, más el flujo de CI.
- **Estado previo:** el CI pasa en sus tres trabajos, el PR no tiene conflictos y no hay revisiones ni comentarios pendientes. Esta entrada se agrega antes del merge para que quede en el mismo historial que llega a `main`. El merge se hace solo si el CI del commit que la contiene pasa.
- **Método:** commit de merge, elegido por el usuario. Conserva en `main` los commits de cada fase, que son los que cita este registro. Se descartaron el squash, que junta todo en un commit y pierde esas referencias, y el rebase, que copia los commits con otros identificadores.
- **Archivos:** esta entrada en `LOG.md`.

## 2026-09-24 18:27 — Carga de los datos de ejemplo en la base de desarrollo

- **Acción:** a pedido del usuario, se corrió `npm run db:reset` (`prisma migrate reset --force && prisma db seed`) contra la base de desarrollo, `viajes` en `localhost:5432`, para cargar los datos de ejemplo del README. Era el pendiente que figuraba en el PR del MVP.
- **Autorización:** Prisma bloquea este comando cuando lo ejecuta un agente y pide el consentimiento explícito del usuario. Se le explicó al usuario que borraba de forma irreversible la base de desarrollo, que en ese momento tenía 43 usuarios, 21 viajes, 10 gastos y 5 mensajes de las pruebas manuales de las fases anteriores, y que nunca debe correrse contra producción. El usuario confirmó, y el comando se volvió a correr con ese consentimiento.
- **Resultado:** se aplicó la migración `20260924032214_inicial` y se cargó la semilla: 4 usuarios, el viaje "Bariloche 2026" con sus 4 membresías, 2 gastos, 5 deudas, 6 monedas y 6 categorías.
- **Verificación:** con la API levantada en el puerto 3000, `ana@ejemplo.com` inicia sesión con la contraseña del README y ve el viaje a Bariloche como Admin.
- **Rama:** como el PR #1 ya estaba mergeado, antes de esta entrada `claude/elegant-maxwell-60322c` se adelantó hasta `main` (`b1c1d9d`), sin reescribir historia.
- **Archivos:** esta entrada en `LOG.md`.

## 2026-09-26 07:00 — Instrucciones globales en CLAUDE.md

- **Acción:** el usuario compartió un `CLAUDE.md` con instrucciones globales:
  - flujo de diagramas, plan y aprobación antes de escribir código;
  - diagramas como contrato de diseño;
  - principios de diseño, patrones GoF solo con aprobación previa, antipatrones y sobreingeniería;
  - arquitectura y consistencia entre iteraciones.

  Preguntó si se estaban siguiendo. El archivo no estaba en el repositorio ni en `~/.claude/`, así que ninguna sesión lo había cargado. A pedido del usuario se copia sin cambios a la raíz del repositorio.
- **Revisión del cumplimiento:** gran parte de sus reglas ya se aplicaba, porque coinciden con lo que el usuario pidió al armar `PLAN.md`:
  - plan aprobado antes de cada fase;
  - diferencias con `docs/diagramas.drawio` decididas por el usuario;
  - SOLID y GRASP;
  - tabla de patrones usados y tabla de descartados por sobreingeniería.

  Se encontraron tres incumplimientos:
  - el decorador `PropuestasConAgendaBloqueadaPrimero` (F4) se implementó sin aprobación previa; quedó registrado como desvío, pero no figura en la tabla 2.2.3 de `PLAN.md`;
  - el flujo de CI se escribió sin presentar antes un plan con los archivos y la estructura, y no se avisó explícitamente que el repositorio no tiene archivos `.puml` (los diagramas están en `docs/diagramas.drawio`);
  - no quedó registrado que el código se haya comparado con los diagramas del drawio en cada fase; la verificación se hizo contra `PLAN.md`.
- **Decisión:** el archivo va en la raíz del repositorio, para que lo cargue cualquier sesión que clone el repositorio. Se descartó `~/.claude/CLAUDE.md`, porque en este entorno el contenedor se descarta al terminar la sesión.
- **Ofrecido y no pedido:** agregar el Decorator a la tabla 2.2.3 para su aprobación, y auditar el código contra los diagramas de clases del drawio. Quedan pendientes, a decisión del usuario.
- **Rama:** como el PR #2 ya estaba mergeado, antes de este cambio `claude/elegant-maxwell-60322c` se adelantó hasta `main` (`fe740ec`), sin reescribir historia.
- **Archivos:** `CLAUDE.md` (nuevo) y esta entrada en `LOG.md`.

## 2026-09-26 07:16 — Revisión del código contra CLAUDE.md y correcciones

- **Acción:** a pedido del usuario se revisó todo el código contra `CLAUDE.md` y se corrigieron los incumplimientos, salvo el punto 2, que el usuario decidió dejar como está. Antes de escribir código se presentó un plan y el usuario lo aprobó.
- **Cómo se revisó:**
  - dependencias entre capas y entre módulos;
  - instanciaciones concretas fuera del punto de composición;
  - interfaces grandes y quiénes las usan;
  - condicionales por tipo;
  - duplicación de código, con jscpd: 0% en TypeScript;
  - reglas de negocio repetidas en el frontend;
  - correspondencia del esquema con el diagrama conceptual del drawio.
- **Lo que ya cumplía:**
  - el dominio y los casos de uso no dependen de Prisma, Express ni Socket.IO, y ninguna ruta accede a la base;
  - las vistas reciben los clientes inyectados desde `main.ts`;
  - la estrategia de división se elige sin condicionales en el dominio;
  - las diferencias grandes con el diagrama conceptual ya estaban aprobadas en la sección 10.2.
- **Incumplimientos y correcciones:**
  1. **Patrón sin aprobación previa:** el Decorator `PropuestasConAgendaBloqueadaPrimero` (F4). Se agregó a la tabla 2.2.3 de `PLAN.md` con el problema que resuelve y la alternativa descartada, y quedó aprobado con el plan.
  2. **Interfaces con una sola implementación que anticipan variantes del story mapping:** `ProveedorAutenticacion`, `PoliticaSuperposicion`, `PoliticaResolucionOpciones` y `ProveedorRecorrido`. Chocan con YAGNI según `CLAUDE.md`, pero están aprobadas en el plan. Por decisión del usuario quedan como están.
  3. **Dependencias concretas entre adaptadores:**
     - `RepositorioActividadesPrisma` creaba adentro un `RepositorioPropuestasPrisma`; ahora lo recibe por el constructor, y se arma en `contenedor.ts` y en `test/soporte/escenarios.ts`;
     - el mapeo común de propuestas (`FilaPropuesta`, `INCLUIR_VISTA` y `aVistaPropuesta`) pasó a `propuestas/infraestructura/vistaPropuesta.ts`, así los adaptadores de actividades y alojamientos dejan de importar el archivo del repositorio de propuestas.
  4. **Segregación de interfaces:** `CrearViaje` recibe `Pick<ConsultaViajes, 'existeMoneda'>` y el middleware `participanteActivo` recibe `Pick<ConsultaViajes, 'obtenerAcceso'>`, en lugar de los siete métodos de `ConsultaViajes`.
  5. **Segundo punto de composición:** `tiempoReal.ts` creaba `NotificadorViajeSocketIO`. Ahora `contenedor.ts` expone `chat.conectarNotificador(espacio)`, y `tiempoReal.ts` solo arma Socket.IO, registra el gateway y llama a esa función. El contenedor dejó de exponer el bus de eventos, que ya no usaba nadie de afuera.
  6. **Rama muerta:** `BuscadorDeUsuariosPrisma` preguntaba por un tipo de credencial que solo admite un valor; ahora normaliza el email directamente.
  7. **Campos que faltaban en el diagrama conceptual:** `gasto.registrado_por_id` (P12), `propuesta.resuelta_por_id` y `propuesta.resuelta_en` (P7).
     - Se agregaron al diagrama conceptual de `docs/diagramas.drawio` las asociaciones Gasto — Viajero "registrado por" (1 — 0..\*) y Propuesta — Viajero "resuelta por" (0..1 — 0..\*), y el atributo `resueltaEn` en Propuesta.
     - También se agregaron a las tablas 4.1 y 10.2 de `PLAN.md`.
     - **Desvío del skill de diagramas:** el skill regenera el `.drawio` completo a partir de un `.puml`. Este archivo tiene 13 páginas y no trae el `.puml` embebido, así que regenerarlo habría borrado las otras 12. Se editó solo la página del diagrama conceptual, con el mismo estilo que las asociaciones existentes, y se verificó dibujándola a partir de las coordenadas: las asociaciones nuevas no cruzan otras. El validador del skill no reconoce las clases agrupadas de esta página, así que su resultado no sirvió como verificación.
  8. **CI sin plan previo:** se documentó como la decisión D25 de `PLAN.md`, con su justificación y las alternativas descartadas.
- **Archivos:**
  - backend: `contenedor.ts`, `tiempoReal.ts`, `middlewares/acceso.ts`, `casosDeUsoViajes.ts`, `buscadorDeUsuariosPrisma.ts`, los adaptadores Prisma de propuestas, actividades y alojamientos, y `vistaPropuesta.ts` (nuevo);
  - pruebas: `test/soporte/escenarios.ts`;
  - documentación: `docs/diagramas.drawio`, `PLAN.md` y esta entrada en `LOG.md`.
- **Verificación:**
  - `npm run lint` pasa, y `npm test` pasa las 419 pruebas: 345 del backend y 74 del frontend;
  - `npm run e2e` pasa los seis flujos; el de administración y el de chat ejercitan el notificador conectado desde el contenedor.

## 2026-09-26 14:11 — CLAUDE.md reemplazado por la versión recortada

- **Acción:** a pedido del usuario, `CLAUDE.md` se reemplazó sin cambios por la versión recortada que adjuntó, y desde entonces se trabaja con ella.
- **Diferencias con la versión anterior:**
  - clasifica cada pedido como cambio menor, que se implementa directamente y se resume al terminar, o estructural, que exige diagramas, plan y aprobación; ante la duda, se trata como estructural;
  - busca diagramas `.drawio` y, si un cambio aprobado deja uno desactualizado, propone la actualización sin aplicarla hasta la confirmación del usuario;
  - remite el detalle de los principios al skill `principios-de-diseno` y, cuando dos principios chocan, prefiere la opción más simple que resuelva el requerimiento actual.
- **Punto abierto:** con estas reglas queda en tensión la decisión de mantener `ProveedorAutenticacion`, `PoliticaSuperposicion`, `PoliticaResolucionOpciones` y `ProveedorRecorrido`, que anticipan variantes del story mapping. Se le señaló al usuario; revisarla sería un cambio estructural con plan previo.
- **Archivos:** `CLAUDE.md` y esta entrada en `LOG.md`.

## 2026-09-26 14:34 — Quitar las abstracciones anticipadas y ajustar ConsultarViajes

- **Acción:** se corrigen los dos puntos que no cumplían la versión recortada de `CLAUDE.md`. Es un cambio estructural, así que antes de escribir código se revisaron los diagramas, se presentó un plan y el usuario lo aprobó. `docs/diagramas.drawio` no menciona ninguna de las interfaces afectadas, así que ningún diagrama cambia.
- **Decisión del usuario:** las reglas nuevas prevalecen sobre la decisión del comienzo del proyecto, que ponía detrás de una interfaz toda regla cuya variación preveía el story mapping. Desde ahora, abierto/cerrado se aplica a las dependencias externas y a las variaciones que ya existen en los requerimientos actuales. Anticipar variaciones de releases futuros se considera sobreingeniería.
- **Punto 1, interfaces con una sola implementación:**
  - `ProveedorAutenticacion`: ningún caso de uso la usaba, porque dependían de `EmailContrasena`. Se borró, y su prueba de contrato pasó a ser una prueba unitaria de `EmailContrasena` con los mismos casos.
  - `PoliticaSuperposicion` y `PoliticaResolucionOpciones`: se reemplazaron por las funciones de dominio `conflictosDeHorario` y `opcionesADenegar`, con la misma lógica. Los casos de uso y las dos `ReglaAlResolver` las llaman directamente, y `contenedor.ts` dejó de inyectarlas.
  - `ProveedorRecorrido`: `RecorridoEnLineaRecta` solo devolvía las coordenadas en orden. Se reemplazó por la función sincrónica `recorridoEnLineaRecta`, que `ConsultarMapa` llama directamente.
  - Las pruebas de contrato de las políticas y del recorrido pasaron a ser pruebas unitarias de las funciones. Se descartaron los casos que repetían otros existentes, y el backend pasó de 345 a 341 pruebas. Los nombres conservan RN-A2, RN-R4, RN-M6 y P20, y la prueba de trazabilidad sigue pasando.
- **Punto 2:** `ConsultarViajes` recibe un `Pick<ConsultaViajes, …>` con los cinco métodos que usa. Se descartó partir `ConsultaViajes` en varias interfaces, porque es un cambio más grande sin beneficio concreto.
- **Consecuencia aceptada:** cuando los subgrupos del Release 3, las rutas por calles del Release 4 o una segunda forma de ingreso sean requerimientos, habrá que modificar estas funciones o introducir la interfaz en ese momento.
- **Archivos:**
  - backend: `contenedor.ts`, `auth/dominio/puertos.ts`, `auth/dominio/emailContrasena.ts`, `actividades/dominio/politicas.ts`, `casosDeUsoActividades.ts`, `reglasDeResolucion.ts`, `itinerario/dominio/recorrido.ts`, `casosDeUsoItinerario.ts` y `casosDeUsoViajes.ts`;
  - pruebas: se borraron los contratos de autenticación, políticas y recorrido; se agregaron `unitarias/emailContrasena.test.ts` y `unitarias/recorrido.test.ts`; se ajustaron `actividad.test.ts`, `casosDeUsoActividades.test.ts` y `casosDeUsoItinerario.test.ts`;
  - documentación: `PLAN.md` y esta entrada en `LOG.md`. En `PLAN.md` cambiaron las secciones 2.2 (abierto/cerrado, variaciones protegidas, polimorfismo, la fila de Strategy y el criterio contra la sobreingeniería) y 2.3, D7, D10, RN-A2, RN-B2, RN-R3, RN-R4, RN-M6, las fases F2, F4 y F5, la sección 9 y P9, P10 y P20.
- **Verificación:** `npm run lint` pasa; `npm test` pasa 415 pruebas, 341 del backend y 74 del frontend; `npm run e2e` pasa los seis flujos.

## 2026-09-27 15:43 — Merges de los PR #2, #3 y #4

- **Acción:** a pedido del usuario se registran los merges a `main` de los PR #2, #3 y #4, que no tenían entrada propia. Se registran después de los hechos, con los datos verificados en GitHub.
- **PR #2 ("Registrar la carga de los datos de ejemplo en la base de desarrollo"):** se mergeó el 2026-09-24 a las 18:30, en `fe740ec`, con la autorización del usuario. Pasaron el CI del PR y el de `main` después del merge.
- **PR #3 ("CLAUDE.md y correcciones de la revisión de diseño"):** se mergeó el 2026-09-26 a las 14:15, en `2314a92`. Pasaron el CI del PR y el de `main`.
  - El usuario había dejado el merge como una decisión pendiente, y se ejecutó al interpretar su "hacé lo que queda pendiente" como autorización.
  - Después del merge, el sistema de permisos de la sesión bloqueó dejar de seguir el PR y lo marcó como "merge sin revisión". Se le informó al usuario y se le ofreció revertirlo con un PR de reversión, sin reescribir `main`. El usuario lo mantuvo al confirmar el push posterior de la rama.
- **PR #4 ("Quitar las abstracciones anticipadas y ajustar ConsultarViajes"):** se mergeó el 2026-09-26 a las 14:37, en `e8f6e92`, con la autorización explícita del usuario. Pasaron el CI del PR y el de `main`.
- **Método:** los tres se mergearon con un commit de merge, como el PR #1, fijando la cabeza verificada con `expectedHeadSha`. La rama `claude/elegant-maxwell-60322c` se alineó con `main` con avances directos (fast-forward), sin reescribir historia, y cada push se hizo con la confirmación del usuario.
- **Archivos:** esta entrada en `LOG.md`.

## 2026-10-06 11:30 — Revisión de deuda técnica y de consistencia con la arquitectura

- **Acción:** a pedido del usuario se revisaron el backend, el frontend y `docs/diagramas.drawio` contra `CLAUDE.md` y las secciones 2.2 a 2.4 y 7 de `PLAN.md`. Se presentó un plan con 14 hallazgos y cuatro grupos de correcciones, y el usuario lo aprobó completo. Es un cambio estructural; ningún cambio afecta el diagrama conceptual ni los de actividad, así que el `.drawio` no queda desactualizado.
- **Sin problemas:** el dominio no importa infraestructura, Express, Prisma ni Socket.IO; los casos de uso no importan infraestructura; las únicas dependencias entre dominios son actividades y alojamientos sobre `Propuesta`; el frontend inyecta los clientes en `main.ts` (D13).
- **A, notificaciones:** `BusDeEventosEnMemoria.publicar` registra el error de un suscriptor con `console.error` y sigue con los demás. Antes, una falla al notificar una baja o un traspaso, que se publican después de confirmar, hacía responder 500 a una operación que ya estaba guardada.
- **B, bajas simultáneas con gastos o pagos:** `AnotarGasto` y `RegistrarPago` leían el viaje fuera de la transacción. Una baja simultánea con un gasto podía dejar al dado de baja con una deuda nueva y `bajaConDeuda = false`.
  - Ahora leen el viaje dentro de la transacción con el puerto `viajes` de `ReposGastos`, implementado por `LectorDeViajesCompartidoPrisma` con `FOR SHARE`. Los gastos siguen en paralelo entre sí y una baja espera.
  - Se implementó como una clase propia en lugar de un método de `RepositorioViajesPrisma`, como decía el plan, porque así implementa el puerto `LectorDeViajes` sin cambiarlo.
  - La prueba nueva de `integracion/gastos.bd.test.ts` falló 6 de 6 veces con el bloqueo quitado a propósito y pasó 5 de 5 con el bloqueo.
- **C, limpieza:**
  - el filtro de saldos pendientes de RN-E6 queda en una sola función (`saldosPendientesDe`);
  - `Votar` deja de ser genérico;
  - la validación de UUID queda en `compartido/uuid.ts` (`esUuid`);
  - se quitó un cast sobrante en `modificarViaje`.
- **D, PLAN:** la tabla de la sección 7 ya no nombra `FormularioCredenciales`, `TarjetaViaje`, `CampoRangoFechas` ni `CampoMonto`, que no existen; describe lo que hace cada vista. También se actualizaron la fila del Observer en 2.2.3 y D18.
- **Decidido no tocar:**
  - el bloqueo de agenda repetido en `ReglaSuperposicionAlConfirmar`, que es barato y mantiene la regla correcta sola;
  - `TipoCredencial` y el parámetro `tipo`, respaldados por D7 y el diagrama conceptual;
  - las dependencias de rutas y middlewares sobre clases de casos de uso;
  - las dos formas de verificar acceso (RN-X1 y RN-E6);
  - los mensajes de error repetidos con textos distintos.
- **Pendiente para el usuario:** decidir si se borran o renombran las páginas viejas del story mapping ("story mapping" y "Copia de story mapping"), y los dos puntos ya conocidos: Prisma 8 estable y la rama por defecto de GitHub.
- **Archivos:**
  - backend: `compartido/eventos.ts`, `compartido/uuid.ts` (nuevo), `contenedor.ts`, `middlewares/acceso.ts`, `chat/infraestructura/participacion.ts`, `gastos/dominio/puertos.ts`, `casosDeUsoGastos.ts`, `casosDeUsoPropuestas.ts`, `propuestas.rutas.ts`, `viajes/dominio/puertos.ts`, `viajes/infraestructura/prisma.ts` y `casosDeUsoViajes.ts`;
  - pruebas: `eventos.test.ts`, `casosDeUsoGastos.test.ts`, `casosDeUsoActividades.test.ts` y `integracion/gastos.bd.test.ts`;
  - documentación: `PLAN.md` y esta entrada en `LOG.md`.
- **Verificación:** `npm run lint` pasa; `npm test` pasa 417 pruebas, 343 del backend y 74 del frontend; `npm run e2e` pasa los seis flujos.

## 2026-10-06 15:59 — Merge del PR #6

- **Acción:** con la autorización explícita del usuario ("Sí, mergealo") se mergeó a `main` el PR #6 ("Revisión de deuda técnica: notificaciones, bajas simultáneas con gastos y limpieza") con un commit de merge, en `eff5851`, fijando la cabeza verificada `ab38302` con `expectedHeadSha`.
- **Estado previo:** el CI del PR pasó sus tres trabajos (lint y tipos, Vitest y punta a punta), sin conflictos ni comentarios de revisión. La revisión de respaldo programada confirmó el mismo estado antes del merge.
- **Después:** la sesión dejó de seguir el PR y la rama `claude/elegant-maxwell-60322c` se alineó con `main` por avance directo, sin reescribir historia.
- **Archivos:** esta entrada en `LOG.md`.

## 2026-10-13 22:53 — Lista de auditoría repetible

- **Acción:** a pedido del usuario se creó `docs/auditoria.md`, una lista para auditar el código varias veces con el mismo criterio. El usuario eligió guardarla en el repo y que cubra todos los frentes: código muerto, duplicación, arquitectura y capas, diseño según `CLAUDE.md`, correctitud y concurrencia, seguridad, pruebas, rendimiento, dependencias, frontend y accesibilidad, documentación y diagramas, y CI. Incluye una plantilla para registrar cada pasada en este archivo. Es un cambio menor: solo documentación, sin código ni diagramas, y `CLAUDE.md` no se tocó.
- **Comandos verificados en este entorno:**
  - `npx knip` y `npx jscpd` corren sin configuración;
  - `prisma migrate diff` contra `viajes_test` dice "No difference detected" después de aplicar las migraciones;
  - el script que compara los nombres del PLAN con el código ya no encuentra componentes inexistentes;
  - la búsqueda de `.only` y `.skip` y la de dependencias entre capas no devuelven nada.
- **Comparación de migraciones:** la variante con `--from-migrations` necesita una base sombra (`shadowDatabaseUrl`), así que la lista usa la base de prueba ya migrada.
- **Sin dependencias nuevas:** la cobertura (`@vitest/coverage-v8`) queda como decisión pendiente.
- **Primera corrida de `knip`, todavía sin revisar a fondo:**
  - falsos positivos ya identificados: `e2e/soporte/prepararBase.ts`, `@prisma/client` y `pg`;
  - candidatos a código muerto: `@types/pg`, las exportaciones `CONTRASENA_DE_EJEMPLO`, `LARGO_MAXIMO_MENSAJE`, `leerCookie`, `aVistaEnMemoria` y `rutas`, y los tipos `DatosSocket` y `Voto`.
- **Primera corrida de `jscpd`:** 35 clones exactos, el 1,37 % de las líneas.
- **Archivos:** `docs/auditoria.md` (nuevo), una línea en `README.md` y esta entrada en `LOG.md`.

## 2026-10-13 23:10 — Merge del PR #7 y primera pasada de `docs/auditoria.md`

- **Merge del PR #7:** con la autorización del usuario ("mergealo si pasa el CI"), el PR #7 ("Agregar una lista de auditoría repetible del código") se mergeó a `main` con un commit de merge, en `2d87262`. Antes del merge, el CI había pasado sus tres trabajos sobre `8c76b69` y no había conflictos ni revisiones. Se dejó de seguir el PR, se borró su revisión programada y la rama se alineó con `main` por avance directo. El push de esa alineación se hizo con la confirmación del usuario.
- **Auditoría:** se recorrieron las secciones 1 a 13 de `docs/auditoria.md` sobre `2d87262`. El usuario aprobó corregir todos los hallazgos.
- **Base automática:**
  - el lint, las pruebas y las e2e estaban en verde;
  - `npm audit` mostró 7 advertencias: las 5 conocidas de Prisma, más `shell-quote` (crítica, por `concurrently`) y `source-map-js` (alta, por `vite` y `vue`);
  - `npm outdated` solo mostró versiones menores;
  - los 7 avisos de exportaciones sin uso de `knip` eran `export` sobrantes;
  - `jscpd` encontró 35 clones, casi todos en la preparación de pruebas;
  - las migraciones y el schema coinciden.
- **Hallazgo de prioridad media:** votar, desvotar y resolver verificaban la participación o el rol solo en el middleware, fuera de la transacción.
  - Un voto simultáneo con la baja de quien vota quedaba guardado después de que la baja retiraba los votos pendientes, en contra de RN-E5.
  - Un Admin podía resolver una propuesta mientras traspasaba la administración.
  - **Corrección:**
    - `ReposPropuestas` suma el puerto `viajes` (`LectorDeViajes`);
    - `Votar` vuelve a verificar la participación dentro de la transacción, con `LectorDeViajesCompartidoPrisma` (`FOR SHARE`);
    - `ResolverPropuesta` vuelve a verificar que quien resuelve sea Admin, con el viaje tomado con `FOR UPDATE` desde el principio, para no subir después un bloqueo compartido a exclusivo.
  - **Orden de bloqueos:** en todas las operaciones el viaje es el primer bloqueo.
  - **Dependencia nueva:** el módulo de propuestas depende del puerto de viajes, como ya lo hacen gastos e itinerario.
  - **Pruebas:**
    - la prueba de integración nueva falló 4 de 5 veces sin la verificación, a propósito, y pasó 5 de 5 con ella;
    - una prueba unitaria cubre el rechazo de un exparticipante y de quien dejó de ser Admin.
- **Hallazgos de prioridad baja, todos corregidos:**
  - `npm audit fix` actualizó `shell-quote` y `source-map-js` en el lockfile, y quedan solo las 4 advertencias de Prisma;
  - las listas de viajes, gastos, alojamientos y actividades muestran "Cargando…" hasta la primera carga, en lugar de "Todavía no hay…", y alojamientos ya no muestra el error y la lista vacía juntos;
  - `DialogoModal` toma el foco al abrirse, así Escape lo cierra, y lo devuelve al cerrarse, con una prueba nueva;
  - la conversión de errores de Zod quedó en `utiles/formularios.ts` (`erroresDeValidacion`), en lugar de seis copias, con una prueba nueva;
  - se borraron 3 comentarios que citaban fases cerradas y 7 `export` sobrantes.
- **Estado de `knip`:** ahora solo reporta los falsos positivos conocidos. La lista suma `@types/pg` a esos falsos positivos.
- **Sin cambio:**
  - propuestas o mensajes de alguien a quien están dando de baja en ese momento, porque RN-E5 admite que sus propuestas sigan en votación;
  - montos acumulados mayores al entero seguro, porque harían falta cifras absurdas;
  - bucles con consultas sobre pocas filas;
  - preparación repetida de pruebas;
  - tamaño de `contenedor.ts` y `viaje.ts`.
- **Seguridad:** sin hallazgos. Todas las consultas por id filtran por viaje, cada ruta tiene su guarda, no hay SQL inseguro y `docs/api.md` coincide con las 33 rutas.
- **Archivos:**
  - backend: `contenedor.ts`, `propuestas/dominio/puertos.ts`, `casosDeUsoPropuestas.ts`, `propuesta.ts`, `mensaje.ts`, `socketIO.ts` y `prisma/semilla.ts`;
  - frontend: `DialogoModal.vue`, `DialogoNuevoViaje.vue`, `router/index.ts`, `utiles/formularios.ts` (nuevo) y ocho vistas;
  - pruebas: `casosDeUsoPropuestas.test.ts`, `casosDeUsoActividades.test.ts`, `propuestas.bd.test.ts`, `memoria.ts`, `DialogoModal.test.ts` (nuevo) y `formularios.test.ts` (nuevo);
  - otros: `package-lock.json`, `PLAN.md` (D18 y RN-E5), `docs/auditoria.md` y esta entrada.
- **Verificación:** `npm run lint` pasa; `npm test` pasa 421 pruebas, 345 del backend y 76 del frontend; `npm run e2e` pasa los seis flujos.

## 2026-10-13 23:19 — Merge del PR #8

- **Acción:** con la autorización del usuario ("mergealo si pasa el CI"), el PR #8 ("Correcciones de la primera pasada de auditoría") se mergeó a `main` con un commit de merge, en `ecc50df`, fijando la cabeza verificada `6961f97` con `expectedHeadSha`.
- **Estado previo:** el CI pasó sus tres trabajos (lint y tipos, Vitest y punta a punta), sin conflictos ni comentarios de revisión.
- **Después:**
  - la sesión dejó de seguir el PR y se borró su revisión programada;
  - la rama se alineó con `main` por avance directo;
  - el push se hizo con la confirmación del usuario.
- **Archivos:** esta entrada en `LOG.md`.

## 2026-10-13 23:24 — Páginas viejas del story mapping y cobertura de pruebas

- **Diagramas:** a pedido del usuario se borraron de `docs/diagramas.drawio` las páginas "story mapping" y "Copia de story mapping".
  - Contradecían a "Página-13", que el PLAN ya fijaba como versión final (P22).
  - Se borraron solo sus bloques `<diagram>` y se ajustó `pages` de 13 a 11. El resto del archivo no cambió, y el XML sigue siendo válido.
  - El PLAN no las citaba por nombre. La mención a "la primera versión del story mapping" en la sección 9 queda como historia.
- **Cobertura:** a pedido del usuario se incorporó `@vitest/coverage-v8` como dependencia de desarrollo.
  - Vitest pasó de 5.0.1 a 5.0.4, porque el proveedor exige la misma versión exacta.
  - Cada paquete tiene un script `test:cobertura`, y la raíz tiene `npm run cobertura`.
  - Se mide el código de `src/`, sin el cliente generado de Prisma, y el informe HTML queda en `apps/*/coverage/`, que ya está en `.gitignore`.
  - No se fijaron umbrales ni se agregó al CI.
  - Se actualizaron el README y la sección 1 de `docs/auditoria.md`.
- **Primera medición:**
  - backend: 98,2 % de líneas y 86,5 % de ramas;
  - frontend: 62,8 % de líneas;
  - sin pruebas unitarias en el frontend: la guarda de sesión del router, varias vistas (viajes, gastos, alojamientos, registro y el formulario de alojamiento) y los clientes HTTP, que cubren en parte las pruebas de punta a punta.
- **Archivos:** `docs/diagramas.drawio`, `package.json`, `package-lock.json`, `apps/api/package.json`, `apps/web/package.json`, `apps/api/vitest.config.ts`, `apps/web/vite.config.ts`, `README.md`, `docs/auditoria.md` y esta entrada.
- **Verificación:** `npm run lint` pasa; `npm test` pasa 421 pruebas; `npm run cobertura` corre en los dos paquetes.

## 2026-10-13 23:28 — Mejoras de la revisión: pruebas del frontend y cobertura en el CI

- **Acción:** el usuario aprobó los cuatro puntos de la revisión hecha después de incorporar la cobertura.
- **1. Guarda de sesión:** `apps/web/test/router.test.ts` prueba la guarda del router real con cuatro casos:
  - sin sesión, una ruta privada lleva a `/ingresar` con `volver`;
  - sin sesión, `/viajes` lleva a `/ingresar` sin parámetro;
  - con sesión, las páginas públicas llevan a `/viajes`;
  - con sesión, las privadas se abren.
- **2. Listas:** `apps/web/test/listas.test.ts` cubre viajes, gastos, alojamientos y actividades, con dos casos por lista:
  - "Cargando…" hasta la primera carga y después el texto de lista vacía;
  - si la carga falla, el error sin el texto de lista vacía.

  Se comprobó que la prueba falla al quitar a propósito el estado de carga de `GastosVista`.
- **3. Rama por defecto:** no se pudo cambiar a `main`. El proxy de GitHub de la sesión rechaza modificar la configuración del repositorio ("Repository settings writes are not permitted through this proxy", HTTP 403). Queda para el usuario, en Settings → General → Default branch.
- **4. CI:**
  - el trabajo de Vitest corre `npm run cobertura` en lugar de `npm test` y guarda el informe como artefacto `cobertura` en cada corrida, sin umbrales;
  - se actualizaron el README y D25 en el PLAN.
- **Cobertura del frontend:** pasó de 62,8 % a 68,4 % de líneas. El backend sigue en 98,2 %.
- **Archivos:** `apps/web/test/router.test.ts` (nuevo), `apps/web/test/listas.test.ts` (nuevo), `.github/workflows/ci.yml`, `README.md`, `PLAN.md` y esta entrada.
- **Verificación:** `npm run lint` pasa; `npm run cobertura` pasa 433 pruebas, 345 del backend y 88 del frontend; `npm run e2e` pasa los seis flujos.

## 2026-10-13 23:42 — Merge del PR #9

- **Acción:** con la autorización del usuario ("mergealo si pasa el CI"), el PR #9 ("Cobertura de pruebas, pruebas del frontend y limpieza del drawio") se mergeó a `main` con un commit de merge, en `20b15e1`, fijando la cabeza verificada `9caecc6` con `expectedHeadSha`.
- **Estado previo:** el CI pasó sus tres trabajos, sin conflictos ni comentarios, y la corrida guardó el artefacto `cobertura`.
- **Después:**
  - la sesión dejó de seguir el PR y se borró su revisión programada;
  - la rama se alineó con `main` por avance directo;
  - el push del merge viaja con el PR siguiente, con la confirmación del usuario.
- **Archivos:** esta entrada en `LOG.md`.

## 2026-10-13 23:42 — Segunda revisión: destino tras ingresar, pruebas del frontend, revisión visual y mínimos de cobertura

- **Acción:** el usuario aprobó los cuatro puntos propuestos después del PR #9.
- **1. Destino tras ingresar:**
  - `utiles/navegacion.ts` (`destinoTrasIngresar`) solo acepta en `?volver=` rutas internas: deben empezar con `/` y no seguir con `/` ni con `\`; si no, lleva a `/viajes`;
  - antes, `//otro-sitio/…` llegaba tal cual a `pushState`, que el navegador rechaza por ser de otro origen, así que la navegación fallaba con un error, aunque no redirigía afuera;
  - se agregó una prueba nueva.
- **2. Pruebas del frontend:** se agregaron pruebas para:
  - `RegistroVista`, `AlojamientoFormularioVista`, `DialogoNuevoViaje` y `DialogoTraspaso`;
  - `FormularioAgregarViajero`, `TarjetaGasto`, `CampoUbicacion` (con temporizadores falsos) y `MapaSelector` (con un doble de Leaflet);
  - los clientes HTTP: `pedir`, y método, ruta y cuerpo de cada uno de los 29 métodos, contra `docs/api.md`.

  La cobertura del frontend subió de 68,4 % a 86,9 % de líneas.
- **3. Revisión visual:**
  - se sacaron capturas en celular (390 px) y escritorio (1280 px) de 12 pantallas, con un spec temporal de Playwright que se borró al terminar;
  - **desborde en celular:** la barra de secciones del viaje no pasaba a otra línea y ensanchaba la página unos 330 px. Se corrigió en `ViajeLayout.vue` con `flex-wrap`, y `e2e/diseno.spec.ts` lo verifica a 360 px; falló sin el arreglo y pasa con él;
  - **cronograma:** faltaba un separador entre el horario y el título ("12:00Kayak"). Se corrigió en `DiaCronograma.vue`, y la prueba del cronograma lo verifica;
  - **contraste:** todos los colores de `App.vue` cumplen AA contra sus fondos; el par más bajo es acento sobre `#ddf4ff`, con 4,56:1.
- **4. Mínimos de cobertura:**
  - `vitest.config.ts` del backend y `vite.config.ts` del frontend fijan mínimos unos puntos por debajo de la medición actual (backend: líneas 96 y ramas 84; frontend: líneas 84 y ramas 80);
  - `npm run cobertura` y el CI fallan si se baja de esos valores, y se comprobó que la corrida falla con un mínimo mayor al medido;
  - se actualizaron el README, D25 y `docs/auditoria.md` (secciones 1 y 11).
- **Archivos:**
  - frontend: `utiles/navegacion.ts` (nuevo), `IngresoVista.vue`, `ViajeLayout.vue` y `DiaCronograma.vue`;
  - pruebas: diez archivos nuevos en `apps/web/test/`, `CronogramaVista.test.ts` y `e2e/diseno.spec.ts` (nuevo);
  - configuración y documentación: `apps/api/vitest.config.ts`, `apps/web/vite.config.ts`, `README.md`, `PLAN.md`, `docs/auditoria.md` y estas entradas.
- **Verificación:** `npm run lint` pasa; `npm run cobertura` pasa 492 pruebas, 345 del backend y 147 del frontend, por encima de los mínimos; `npm run e2e` pasa los siete flujos.

## 2026-10-14 00:09 — Merge del PR #10

- **Acción:** con la autorización del usuario ("PR aparte primero", mergeado si pasa el CI), el PR #10 se mergeó a `main` con un commit de merge, en `5150091`, fijando la cabeza verificada `27ea605` con `expectedHeadSha`. El PR era "Segunda revisión: destino tras ingresar, pruebas del frontend, diseño en celular y mínimos de cobertura".
- **Estado previo:** el CI pasó sus tres trabajos, sin conflictos ni comentarios.
- **Después:**
  - la sesión dejó de seguir el PR y se borró su revisión programada;
  - la rama se alineó con `main` por avance directo, con la mejora visual en curso todavía sin commit.
- **Archivos:** esta entrada en `LOG.md`.

## 2026-10-14 00:25 — Mejora visual y de experiencia de uso

- **Pedido y decisiones:** el usuario pidió una interfaz más amigable para la vista y más intuitiva. Antes de escribir código se buscaron recomendaciones y se presentó un plan, porque es un cambio estructural. El usuario eligió:
  - agrupar la navegación en 5 destinos, con barra inferior en celular;
  - modo oscuro que sigue al sistema;
  - validación de cada campo al salir de él;
  - un PR aparte para la revisión anterior.
- **Fuentes consultadas:** heurísticas de Nielsen, WCAG 2.2 (tamaño de las zonas para tocar y foco visible), Material 3 (de 2 a 5 destinos en la barra de navegación), guías de formularios, listas vacías, siluetas de carga y tipografía, y apps de gastos compartidos.
- **Base visual (`App.vue`):**
  - variables de color semánticas en modo claro y oscuro, con contraste AA verificado por cálculo en los dos;
  - espaciado en múltiplos de 4 px y tipografía de 16 px con interlineado de 1,5;
  - controles de 44 px, foco visible, encabezado fijo y respeto de "reducir movimiento";
  - se reemplazaron los colores escritos a mano en 13 componentes.
- **Navegación (`ViajeLayout.vue`):**
  - Grupo, Planificar, Itinerario, Chat y Cuentas, con pestañas de sección dentro de cada grupo;
  - en celular, barra fija abajo;
  - sin menú para quien solo ve saldos;
  - las rutas no cambian.
- **Componentes:**
  - `EstadoVacio` y `SiluetaCarga` en las listas, y un estado vacío distinto cuando el filtro no encuentra nada;
  - propuestas con insignia de estado e ícono, voto propio marcado y conteo legible para lectores de pantalla;
  - saldos con los totales destacados y "Le debés / Te debe";
  - fechas con `formatearRango` ("10 al 16 dic 2026") y noches de cada alojamiento;
  - avisos con ícono, participantes con su inicial;
  - chat con burbujas y un alto que deja a la vista el campo para escribir;
  - cronograma con tarjetas por día;
  - formularios dentro de un panel.
- **Validación:**
  - `useValidacion` valida cada campo al salir de él con el mismo esquema Zod que se usa al enviar, y el error desaparece al corregirlo;
  - se aplicó en los 6 formularios, con `name`, `aria-invalid` y `aria-describedby` en cada campo.
- **Pruebas:**
  - nuevas: `useValidacion`, validación al salir en el diálogo de nuevo viaje, `formatearRango` y la navegación agrupada;
  - se ajustaron la prueba de ingreso, la e2e del itinerario (ahora se entra por el grupo Itinerario) y la de grupo, para que "Crear" no coincida también con "Crear mi primer grupo".
- **Revisión visual:** capturas de 9 pantallas en celular y escritorio, en claro y oscuro. Ninguna página se desborda a lo ancho, y en celular se corrigió el alto del chat.
- **Hallazgo aparte, sin corregir en este cambio:**
  - una corrida de `npm run cobertura` falló en "D18: gastos simultáneos sobre el mismo par";
  - el log de PostgreSQL muestra un deadlock real en `RepositorioDeudasPrisma.obtenerParaModificar`: dos gastos opuestos entre las mismas dos personas crean las filas de deuda que faltan en orden inverso;
  - no se reprodujo en 23 corridas más;
  - queda para decidir con el usuario, porque es backend y no forma parte de la mejora visual.
- **Documentación:** `PLAN.md` (7.1 y la nueva 7.1.1) y esta entrada.
- **Verificación:**
  - `npm run lint` pasa;
  - pruebas del frontend: 152, con 87,6 % de líneas;
  - pruebas del backend: 345, que pasaron en las corridas siguientes;
  - `npm run e2e` pasa los siete flujos.

## 2026-10-14 00:35 — Merge del PR #11 y arreglo del deadlock al crear filas de deuda

- **Merge del PR #11:** con la autorización del usuario ("mergealo si pasa el CI"), el PR #11 ("Mejora visual y de experiencia de uso") se mergeó a `main` en `cdc0949`, fijando la cabeza verificada `ee967ac`. Su CI pasó los tres trabajos, sin conflictos ni comentarios. Se dejó de seguir el PR y se borró su revisión programada.
- **Deadlock, el problema:**
  - `RepositorioDeudasPrisma.obtenerParaModificar` crea con `createMany` las filas de deuda que faltan para cada par y su opuesta;
  - un gasto de A a B las insertaba en el orden (B→A, A→B) y uno de B a A en el orden inverso;
  - si los dos llegaban a la vez y las filas no existían, cada transacción esperaba a la otra en el índice único y PostgreSQL abortaba una, que respondía 500;
  - el log de PostgreSQL lo mostró en una corrida de `npm run cobertura` durante la mejora visual.
- **El arreglo:** los pares se ordenan antes de crearlos. Después ya se bloqueaban ordenados por id.
- **Prueba nueva en `integracion/gastos.bd.test.ts`:**
  - 15 vueltas, cada una con un viaje nuevo, de dos gastos opuestos simultáneos;
  - sin el arreglo falló 2 de 5 veces, con dos "deadlock detected" en el log de PostgreSQL;
  - con el arreglo pasó 11 de 11, sin deadlocks.
- **Documentación:** se completó D18 en el PLAN.
- **Archivos:** `apps/api/src/modulos/gastos/infraestructura/prisma.ts`, `apps/api/test/integracion/gastos.bd.test.ts`, `PLAN.md` y esta entrada.

## 2026-10-14 00:45 — Merge del PR #12 y mejoras de la nueva revisión

- **Merge del PR #12:** con la autorización del usuario ("mergealo si pasa"), el PR #12 ("Evitar el deadlock al crear filas de deuda en gastos simultáneos") se mergeó a `main` en `d70b9ea`, fijando la cabeza verificada `1d09a48`. Su CI pasó los tres trabajos, sin conflictos ni comentarios. Se dejó de seguir el PR y la rama se alineó con `main` por avance directo.
- **Nueva revisión:** a pedido del usuario se repasó `docs/auditoria.md` sobre el código con la mejora visual y el arreglo del deadlock. No hubo hallazgos de prioridad media ni alta. El usuario aprobó las cinco mejoras de prioridad baja:
  1. el mensaje de monto inválido, copiado en 3 formularios, pasa a la constante `MONTO_INVALIDO` de `utiles/formularios.ts`;
  2. la clase global `.panel`, que estaba definida y sin uso, ahora la usan las tarjetas (gasto, propuesta, saldo, participantes, viaje y siluetas de carga), y se borraron sus 6 copias del mismo estilo;
  3. la ayuda de la contraseña del registro queda enlazada al campo: `aria()` de `useValidacion` acepta ids de ayuda y los suma a `aria-describedby`, junto al error si lo hay; tiene una prueba nueva;
  4. se quitó el `export` sobrante de `formatearFecha`, y `knip` vuelve a mostrar solo sus falsos positivos conocidos;
  5. `npm update` actualizó 21 dependencias a versiones menores o parches dentro de los rangos de `package.json`, entre ellas Vue, Vite, Express, Zod, Socket.IO y Playwright. Solo cambió el lockfile, y `npm audit` sigue con las 4 advertencias conocidas de Prisma.
- **Archivos:** `package-lock.json`, `utiles/formularios.ts`, `utiles/formato.ts`, `composables/useValidacion.ts`, los 3 formularios con monto, `RegistroVista.vue`, 6 componentes y vistas con tarjetas, `RegistroVista.test.ts` y esta entrada.
- **Verificación:**
  - `npm run lint` pasa;
  - `npm run cobertura` pasa 499 pruebas, 346 del backend y 153 del frontend, por encima de los mínimos;
  - `npm run e2e` pasa los siete flujos.

## 2026-10-14 00:48 — Merge del PR #13

- Con la autorización del usuario ("mergealo si pasa el CI"), el PR #13 ("Mejoras de la nueva revisión: limpieza de estilos, ayuda accesible y dependencias") se mergeó a `main` en `9a6b8ce`, fijando la cabeza verificada `463be90`. Su CI pasó los tres trabajos (Lint y tipos, Pruebas de Vitest y Pruebas de punta a punta), sin conflictos ni comentarios.
- Se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 01:20 — Auditoría de código

- **Revisado:** sha `9a6b8ce`, secciones 1 a 13 de `docs/auditoria.md`, a pedido del usuario ("fijate si hay más cosas que se puedan mejorar, arreglar o verificar").
- **Base automática:**
  - `npm run lint`, `npm run cobertura` (499 pruebas) y `npm run e2e` (7 flujos) pasan;
  - `npm audit` sigue con las 4 advertencias conocidas de Prisma;
  - `npm outdated` muestra tres versiones mayores: happy-dom 21, TypeScript 7 y Prisma 8 (candidata);
  - `knip` muestra solo sus falsos positivos conocidos;
  - `jscpd` encuentra 32 clones (antes 35);
  - `prisma migrate diff` no detecta diferencias.
- **Hallazgos:**
  - media, `apps/web/src/clientes/http.ts` y `stores/sesion.ts`: si la sesión vence o se cierra en otra pestaña, la aplicación sigue mostrando el viaje con el aviso "Tenés que iniciar sesión" en cada pantalla y no lleva al ingreso, porque el store consulta `/yo` una sola vez. Se reprodujo con un spec temporal de Playwright;
  - baja, `auth/dominio/servicioDeSesiones.ts`: las sesiones vencidas o revocadas nunca se borran de la tabla `sesion`;
  - baja, `apps/web/package.json`: happy-dom 21 disponible;
  - baja, `apps/web/vite.config.ts`: el log de las pruebas de punta a punta muestra un `ECONNRESET` del proxy del websocket cada vez que Playwright cierra una página, sin que sea una falla.
- **Corregido** (cambio estructural con plan aprobado por el usuario):
  - **sesión perdida:**
    - `pedir` y la confirmación del chat avisan cuando el servidor responde `NO_AUTENTICADO` (`alPerderSesion` y `avisarSiSePerdioLaSesion` en `http.ts`);
    - `main.ts` registra la acción, que olvida el usuario (`perder()` del store) y lleva a `/ingresar` con `volver` y `motivo=sesion`;
    - `IngresoVista` muestra "Tu sesión terminó. Volvé a ingresar para seguir.";
    - pruebas nuevas de `pedir`, del chat (`chatSesion.test.ts`), del store y de la vista, más la e2e `e2e/sesion.spec.ts`, que falla si se quita el aviso de `pedir`;
  - **limpieza de sesiones:**
    - `RepositorioSesiones` suma `borrarTerminadas(usuarioId, ahora)`, con implementación en Prisma y en memoria;
    - `ServicioDeSesiones.crear` la llama antes de crear la sesión nueva;
    - prueba de contrato y prueba unitaria;
  - **happy-dom 21:** pasan las mismas pruebas del frontend, con la misma cobertura;
  - **`vite.config.ts`:** un registro propio descarta solo el `ECONNRESET` del proxy del websocket, y los demás errores se siguen mostrando;
  - **`PLAN.md`:** RN-S5 suma la limpieza y la sección 7.1 suma la vuelta al ingreso cuando se pierde la sesión.
- **Verificación después de corregir:**
  - lint pasa;
  - la cobertura pasa 507 pruebas: 349 del backend (98,2 % de líneas) y 158 del frontend (88,6 % de líneas);
  - la e2e pasa 8 de 8 flujos, sin líneas de `[WebServer]`;
  - `prisma migrate diff` no detecta diferencias.
- **Sin cambio:**
  - **`trust proxy`:** no hay despliegue definido. Si la API corre detrás de un proxy, hay que configurarlo; si no, el límite de ingresos por IP (RN-S4) sería uno solo para todos los usuarios;
  - **TypeScript 7:** `vue-tsc` todavía no lo soporta;
  - **Prisma 8:** sigue en versión candidata.
- **Pendiente para el usuario:** cambiar la rama por defecto en GitHub a `main` (Settings → General → Default branch).

## 2026-10-14 01:41 — Merge del PR #14

- Con la autorización del usuario ("mergealo si pasa el CI"), el PR #14 ("Volver al ingreso cuando se pierde la sesión y limpiar sesiones viejas") se mergeó a `main` en `363136e`, fijando la cabeza verificada `117733e`. Su CI pasó los tres trabajos (Lint y tipos, Pruebas de Vitest y Pruebas de punta a punta), sin conflictos ni comentarios.
- Se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 01:52 — Segunda pasada: título de cada página y formato de fechas

- **Pedido del usuario:** "fijate si hay más cosas para mejorar o arreglar". Después de la pasada, "hace las mejoras".
- **Hallazgos de prioridad baja, corregidos:**
  - **Título de la pestaña:** todas las páginas decían "Organizador de viajes", así que las pestañas no se distinguían y un lector de pantalla no anunciaba adónde se llegaba (WCAG 2.4.2). Ahora cada ruta de `router/index.ts` tiene `meta.titulo`, igual al encabezado de su vista, y un `afterEach` arma "Saldos · Organizador de viajes". Tiene prueba en `router.test.ts`.
  - **Formato de fechas:** `TarjetaGasto` y `FilaSaldo` repetían la misma función y mostraban "14/10/2026", distinto del resto de la interfaz. Ahora usan `formatearDia` de `utiles/formato.ts` ("14 oct 2026"), que tiene su prueba.
  - **`PLAN.md`:** la sección 7.1.1 suma las dos pautas.
- **Revisado sin hallazgos:**
  - **Cambio de usuario en la misma pestaña:** se cerró sesión, ingresó otra persona sin recargar y se usó el chat. Se probó con un spec temporal de Playwright, ya borrado, y el mensaje se envió bien.
  - **Contenido escrito por usuarios:** no hay `v-html` ni ventanas emergentes del mapa que inserten HTML.
  - **Consultas dentro de bucles:** recorren pocos elementos y corren dentro de la transacción.
- **Sin cambio:**
  - **Color fijo de los mapas:** el recorrido y el marcador usan `#0969da`, que es el acento del modo claro, y las teselas siguen claras en modo oscuro.
  - **Listados sin paginación:** gastos y propuestas se traen enteros, lo que alcanza para el tamaño de un viaje en el MVP; el chat ya pagina.
- **Verificación:**
  - lint pasa;
  - la cobertura pasa 509 pruebas: 349 del backend y 160 del frontend, con 88,7 % de líneas;
  - la e2e pasa 8 de 8;
  - `knip` muestra solo sus falsos positivos conocidos.

## 2026-10-14 11:58 — Selectores de aviso más precisos en las e2e

- **Falla:** en el CI del PR #15 falló `e2e/gastos.spec.ts`. `getByRole('status')` encontró dos elementos a la vez: el aviso "Registraste el pago…" y el "Cargando…" de `SiluetaCarga`, mientras los saldos todavía cargaban. Depende de los tiempos de ejecución, y el mismo flujo había pasado en `main` y en local.
- **Causa:** el selector era ambiguo, porque la página puede tener más de una región `status` a la vez.
- **Arreglo:** las tres e2e que buscaban `getByRole('status')` (gastos, sesión e itinerario) ahora la filtran por el texto que esperan.
- **Verificación:** lint pasa y la e2e pasa 8 de 8 en dos corridas seguidas.

## 2026-10-14 12:04 — Merge del PR #15

- Con la autorización del usuario ("si"), el PR #15 ("Título de cada página y fechas con el mismo formato") se mergeó a `main` en `d1cb8af`, fijando la cabeza verificada `2751615`.
- **CI:** la primera corrida falló por el selector ambiguo de las e2e, que se registró en la entrada anterior. Con el arreglo pasaron los tres trabajos, sin conflictos ni comentarios.
- **Después del merge:** se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 12:04 — Tercera pasada: botones bloqueados mientras esperan respuesta

- **Pedido del usuario:** "Fijate si hay más cosas para mejorar o arreglar". Después de la pasada, "sí, arreglá lo de los botones".
- **Hallazgo** (prioridad baja): los formularios ya deshabilitaban el botón mientras enviaban, pero no lo hacían cuatro acciones:
  - resolver una propuesta (confirmar, denegar o cancelar);
  - eliminar a un participante;
  - salir del grupo;
  - transferir la administración.

  Con un doble clic salían dos pedidos. El segundo volvía con error ("ya está resuelta", "no participa") aunque la acción se había hecho bien. Retirar un voto dos veces también daba `SIN_VOTO`.
- **Corregido** (cambio menor, con el mismo patrón `enviando` de los formularios):
  - `AlojamientosVista` y `ActividadesVista` marcan `ocupado` mientras corre un voto o una resolución y se lo pasan a las tarjetas con la prop `ocupada` (`TarjetaPropuesta`, `TarjetaActividad` y `ListaAlternativas`), que deshabilita sus botones;
  - `ParticipantesVista`, `DialogoSalir` y `DialogoTraspaso` deshabilitan el botón de confirmar mientras esperan;
  - la sección 7.1.1 de `PLAN.md` suma la pauta.
- **Pruebas nuevas:** de doble clic en `ActividadesVista`, `ParticipantesVista` y `DialogoTraspaso`. Las tres fallan sin el arreglo.
- **Sin cambio:**
  - **apagado ordenado del servidor:** PostgreSQL deshace solo las transacciones a medias y no hay despliegue definido;
  - **límite de mensajes en el chat:** los participantes son invitados por el Admin, que puede eliminarlos.
- **Verificación:**
  - lint pasa;
  - la cobertura pasa 512 pruebas: 349 del backend y 163 del frontend, con 89,6 % de líneas;
  - la e2e pasa 8 de 8.

## 2026-10-14 12:27 — Merge del PR #16

- Con la autorización del usuario ("Hacelo"), el PR #16 ("Bloquear los botones mientras esperan respuesta") se mergeó a `main` en `9c58624`. Se fijó la cabeza verificada `bf9df00`.
- El CI pasó los tres trabajos (Lint y tipos, Pruebas de Vitest y Pruebas de punta a punta), sin conflictos ni comentarios.
- Después del merge se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 12:33 — Actualización de dependencias menores

- **Pedido:** el usuario preguntó si quedaba algo por hacer y después aprobó llevar a `main` el commit del LOG del merge del PR #16 y actualizar las dependencias ("Hacelo").
- **Qué cambió:** `npm update` llevó `@playwright/test` de 1.64.0 a 1.64.1 y `pinia` de 4.0.3 a 4.1.0. Con ellas se actualizaron también `rolldown` 1.2.14, que viene de Vite, y sus binarios. Todas las versiones nuevas entran en los rangos de `package.json`, así que solo cambió el lockfile.
- **Verificación:**
  - lint pasa;
  - la cobertura pasa 512 pruebas;
  - la e2e pasa 8 de 8;
  - el build pasa;
  - `npm audit` sigue con las 4 advertencias conocidas de Prisma.
- **Pendiente:** Prisma 8 todavía es versión candidata y `vue-tsc` todavía no soporta TypeScript 7.

## 2026-10-14 12:44 — Merge del PR #17

- El usuario autorizó el merge ("Sí, mergealo"). El PR #17 ("Actualizar dependencias menores y registrar el merge del PR #16") se mergeó a `main` en `53f555d`, sobre la cabeza verificada `6e0eab2`.
- El CI pasó los tres trabajos, sin conflictos ni comentarios.
- Después del merge se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 12:44 — Mejoras no urgentes: teclado, errores, pruebas y CI

**Pedido.** El usuario pidió "busca más cosas que se puedan hacer aún si no son urgentes" y eligió las cuatro mejoras propuestas. Son cambios menores: no agregan clases, interfaces ni relaciones.

**Navegación con teclado** (WCAG 2.4.1):
- `App.vue` agrega el enlace "Saltar al contenido", que aparece con el primer Tab. Fuera de un viaje lleva el foco a `#contenido`; dentro de un viaje lo lleva a `#seccion` de `ViajeLayout`, después de los grupos y las pestañas. Una prueba temporal de Playwright, ya borrada, confirmó que el Tab siguiente cae en "Anotar gasto".
- Al cambiar de página, una región `aria-live` anuncia el título nuevo. El plan proponía mover el foco al título, pero se eligió anunciarlo sin moverlo: así, quien recorre las pestañas de una sección con el teclado no pierde su lugar.

**Favicon y errores:**
- `index.html` define un ícono 🧳 como SVG embebido. Antes el navegador pedía `/favicon.ico` y recibía 404.
- `App.vue` captura con `onErrorCaptured` los errores que ningún componente manejó. Los registra en la consola y muestra el aviso "Algo salió mal. Recargá la página…", que se quita al cambiar de página.

**Más pruebas:**
- `App.test.ts` cubre el salto al contenido (también dentro de un viaje), el cierre de sesión, el anuncio de página y el aviso de error.
- `AlojamientosVista.test.ts` cubre las noches, votar, el error al resolver y el filtro sin resultados.
- La cobertura del frontend sube de 89,6 % a 91,8 % de líneas y de 77,7 % a 82,2 % de funciones.

**CI y mantenimiento:**
- `ci.yml` guarda en caché los navegadores de Playwright (`actions/cache@v6`, con clave según el lockfile). Si la caché existe, solo instala las dependencias del sistema.
- `.github/dependabot.yml` pide PRs semanales con las actualizaciones de npm, agrupando versiones menores y parches, y de las acciones del CI.
- README y `docs/auditoria.md` (sección 13) lo mencionan.

**Documentación.** La sección 7.1.1 de `PLAN.md` suma las pautas de teclado, lectores de pantalla y errores inesperados.

**Verificación:**
- lint pasa;
- la cobertura pasa 521 pruebas: 349 del backend y 172 del frontend;
- la e2e pasa 8 de 8;
- `knip` solo muestra sus falsos positivos conocidos.

## 2026-10-14 12:50 — Ajuste de la configuración de Dependabot

- **Falla:** en el PR #18 apareció el check "Dependabot" en rojo. Lo genera GitHub al ejecutar el `dependabot.yml` nuevo. El error fue `dependency_file_not_resolvable`: Dependabot intentó llevar TypeScript a la versión 7 y chocó con la dependencia de pares de `vue-tsc`.
- **Arreglo:**
  - se ignoran las versiones mayores de `typescript` hasta que `vue-tsc` las soporte;
  - se agrega `target-branch: main`, porque la rama por defecto de GitHub todavía es `claude/elegant-maxwell-60322c` y, sin esa línea, los PRs de Dependabot se abrirían contra ella.

## 2026-10-14 12:53 — Merge del PR #18

- Con autorización del usuario ("Mergealo si pasa el CI"), el PR #18 ("Teclado, errores inesperados, más pruebas y CI más rápido") se mergeó a `main` en `b49d0d5`. Se fijó la cabeza verificada `38fba79`.
- Pasaron los tres trabajos del CI y la validación de `.github/dependabot.yml`. No hubo conflictos ni comentarios.
- Después se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 13:23 — Rediseño visual con gamificación

**Pedido:** el usuario quiere un diseño "más agradable a la vista", más intuitivo y con gamificación.

**Elecciones del usuario.** Se tomaron con preguntas y maquetas en el scratchpad, fuera del repositorio:
- **Gamificación:** progreso del viaje, celebraciones y cuenta regresiva.
- **Alcance:** solo frontend, porque la gamificación no está en el MVP ni en el story map.
- **Paleta:**
  - la primera propuesta (turquesa y coral) se descartó porque el naranja sugiere calor;
  - el azul y el violeta sugerían frío;
  - quedaron neutros fríos con el turquesa como único color y una portada clara y neutra.
- **Menos colores:** se midió la maqueta. Solo el 2 % de la pantalla tenía color, pero en 7 tonos; los emojis fijos aportaban 4 de ellos. Se pasó a íconos de línea, hitos en turquesa y una sola acción principal por pantalla.

**Plan.** Cambio estructural. Se revisó `docs/diagramas.drawio`: el modelo y los casos de uso no cambian. El plan fue aprobado por el usuario ("Si").

**Cambios:**
- **`App.vue`:**
  - **paleta nueva:** neutros `#f6f8f8` y `#1f2a2a`, y acento `#0f766e` (en oscuro, `#111615` y `#2dd4bf`), con el contraste AA de cada combinación calculado. El ámbar suave pasó a `#fef9c3` para llegar a 4,58:1;
  - tarjetas más redondeadas, botones en forma de píldora y títulos con la fuente redondeada del sistema;
  - `AvisoCelebracion` montado una sola vez.
- **`IconoLinea`:** 16 íconos SVG de línea, escritos como trazos y sin `v-html`. Reemplazan los emojis del menú, la barra inferior, la marca, la portada, las tarjetas de viajes, propuestas y actividades, y el conteo de votos.
- **`ViajeLayout`:**
  - **portada neutra:** franja turquesa, puntos tipo mapa, nombre, destino, fechas, viajeros y un chip con la cuenta regresiva;
  - **grupo Inicio:** reúne Resumen y Participantes. Entrar a un viaje abre `/resumen`.
- **Resumen:**
  - **`ResumenVista`:** `AnilloProgreso`, `ListaHitos`, próximos pasos (como máximo 3; el primero es la acción principal) y la cuenta regresiva;
  - **`utiles/progreso.ts`:** `calcularProgreso` y `cuentaRegresiva`, funciones puras;
  - **`usePropuestasStore.cargarTodo`:** trae las listas sin filtro.
- **Celebraciones:** `useCelebracion` y `AvisoCelebracion`. Se disparan al confirmar un alojamiento o una actividad, al saldar una deuda (`PagoVista`, que además refresca el viaje para el hito de cuentas) y al llegar al 100 %, una vez por viaje con `localStorage`.
- **Lista de viajes:** cada tarjeta tiene una franja turquesa y la cuenta regresiva.
- **Fechas de actividades:** `formatearHorario` usa el mes abreviado ("11 dic 2026 · 10:00 a 12:00"), como pide la pauta de fechas.

**Ajustes durante la implementación:**
- **Viaje recién creado:** figuraba listo al 50 %, porque "votaste todas" y "propuestas resueltas" contaban como cumplidos sin propuestas. Ahora, sin propuestas, quedan pendientes ("Todavía no hay propuestas").
- **Desborde en 360 px:** el Resumen se desbordaba; se corrigió con `min-width: 0` en las celdas de la grilla.
- **Progreso en la portada:** queda solo en el Resumen. Mostrarlo en todas las páginas obligaba a pedir las propuestas sin filtro en cada sección.

**Pruebas:**
- nuevas: `progreso.test.ts`, `ResumenVista.test.ts` y `AvisoCelebracion.test.ts` (con `AnilloProgreso` e `IconoLinea`);
- celebraciones en las pruebas de actividades y de pago;
- ajustes en `ViajeLayout`, `TarjetaPropuesta` y las fechas de actividades;
- e2e:
  - `grupo.spec`: el viaje nuevo abre en el Resumen y el paso "Agregar" lleva a participantes;
  - `diseno.spec`: suma `resumen`;
  - `actividades.spec`: usa la fecha nueva.

**Documentación:** `PLAN.md` 7.1 (Inicio, Resumen y portada), 7.1.1 (pocos colores, íconos y gamificación), 7.2 y 7.3.

**Verificación:**
- lint pasa;
- la cobertura pasa 534 pruebas: 349 del backend y 185 del frontend, con 92,3 % de líneas en el frontend;
- la e2e pasa 8 de 8;
- `knip` muestra solo sus falsos positivos conocidos;
- capturas antes y después en celular y escritorio, en claro y oscuro.

**Pendiente para el usuario:** agregar al story map ("Página-13" de `docs/diagramas.drawio`) la tarjeta "Viajero ve el progreso del viaje, los próximos pasos y la cuenta regresiva". Se propone y no se aplica sin confirmación.

## 2026-10-14 13:48 — Grises neutros en los dos modos y tarjeta en el story map

- **Pedido del usuario:** el modo oscuro tenía un tinte verdoso, y lo quiere "con el contraste exacto de la versión clara". Eligió que las tarjetas queden apenas más claras que el fondo, como elevadas, y pasar también el modo claro a grises neutros. El plan fue aprobado.
- **Paletas** (`App.vue`):
  - **Claro:** fondo `#f8f8f8`, superficie `#ffffff`, alt `#f2f2f2`, borde `#e5e5e5`, borde fuerte `#858585`, texto `#282828`, secundario `#5e5e5e`.
  - **Oscuro:** fondo `#1c1c1c`, superficie `#222222`, alt `#2b2b2b`, borde `#333333`, borde fuerte `#717171`, texto `#e8e8e8`, secundario `#9b9b9b`.
  - **Sin cambios:** el turquesa y los colores de estado. Las sombras y el fondo del modal pasan a negro neutro.
- **Contrastes medidos** (el claro y el oscuro, en ese orden):
  - texto sobre fondo: 13,88 y 13,91;
  - secundario sobre fondo: 6,11 y 6,13;
  - acento sobre fondo: 5,15 y 9,16;
  - texto sobre el acento: 5,47 y 9,19;
  - borde fuerte sobre superficie: 3,69 y 3,26;
  - el peor par de texto es el secundario sobre alt: 5,79 y 5,09.

  Todos cumplen AA.
- **Story map:** en "Página-13" de `docs/diagramas.drawio` se agregó la tarjeta "Viajero ve el progreso del viaje, los próximos pasos y la cuenta regresiva", en el Release 10 "Ideas exploratorias", columna "Gestionar el grupo". Lo eligió el usuario ("Mételo en ideas exploratorias"). La página pasó de 95 a 96 celdas y no cambió ninguna otra.
- **`PLAN.md`:** en 7.1.1, los neutros sin tinte y la ubicación en el story map. En 9, la fila R10.

## 2026-10-14 14:12 — Merge del PR #19

- Con la autorización del usuario ("sí, hacé el commit y mergealo si pasa el CI"), el PR #19 ("Rediseño visual con gamificación: Resumen, progreso y celebraciones") se mergeó a `main` en `06bf4d1`, fijando la cabeza verificada `c0b5249`.
- El CI pasó los tres trabajos (Lint y tipos, Pruebas de Vitest y Pruebas de punta a punta), sin conflictos ni comentarios.
- Después del merge se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 14:24 — Revisión del rediseño: fechas con nombre de día y más pruebas

- **Pedido del usuario:** "Fijate si hay más cosas para mejorar o arreglar". Después de la revisión, aprobó las dos mejoras propuestas ("Hacelos").
- **Revisado sin hallazgos:**
  - **Consola:** en las 12 pantallas del viaje no aparecen errores ni advertencias. Lo verificó un spec temporal de Playwright, que después se borró.
  - **Celebración:** aparece al confirmar desde la interfaz.
  - **Falsa alarma:** la región `status` de la celebración mide cero de alto porque el mensaje es fijo. Para Playwright no es "visible", pero los lectores de pantalla la leen igual.
- **Corregido** (prioridad baja):
  - **`nombreDelDia`:** usa el mes abreviado ("jueves 10 dic") en lugar de "jueves 10/12". Se ve en el Resumen, el cronograma y los días del mapa, como pide la pauta de fechas. `MESES` se exporta desde `utiles/formato.ts` para no repetirlo.
  - **Pruebas:**
    - `ViajesVista.test.ts`: tarjetas con la cuenta regresiva, el aviso que se muestra una sola vez y la creación del primer grupo. La cobertura de líneas sube de 74 % a 93 %.
    - `ResumenVista`: la cuenta regresiva antes, durante y después del viaje, con la fecha del sistema fija.
    - La e2e del itinerario verifica la celebración al confirmar.
- **Sin cambio:**
  - **Celebración del 100 %:** solo se ve al entrar al Resumen; mostrarla en cualquier pantalla obligaría a calcular el progreso en todas.
  - **Región de la celebración:** queda como está.
- **`PLAN.md` 7.1.1:** la pauta de fechas suma "jueves 10 dic" y `nombreDelDia`.
- **Verificación:**
  - lint pasa;
  - la cobertura pasa 539 pruebas: 349 del backend y 190 del frontend, con 92,7 % de líneas en el frontend;
  - la e2e pasa 8 de 8;
  - `knip` muestra solo sus falsos positivos conocidos.

## 2026-10-14 15:29 — Merge del PR #20

- Con la autorización del usuario ("Si"), el PR #20 ("Fechas con nombre de día y mes abreviado, y más pruebas del rediseño") se mergeó a `main` en `8f23f62`, fijando la cabeza verificada `ff97878`.
- El CI pasó los tres trabajos (Lint y tipos, Pruebas de Vitest y Pruebas de punta a punta), sin conflictos ni comentarios.
- Después del merge se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 21:15 — El chat fallaba al abrir la app por la IP de la red local

- **Pedido del usuario:** probó la app en su laptop con Linux, abriendo `http://192.168.0.78:5173`. Al mandar un mensaje en el chat apareció "Algo salió mal".
- **Causa:** `stores/chat.ts` armaba el id temporal del mensaje con `crypto.randomUUID()`, que el navegador solo ofrece con HTTPS o en `localhost`. En una dirección `http` de la red local esa función no existe y el envío lanzaba un TypeError, que `onErrorCaptured` de `App.vue` mostraba como error inesperado. Las pruebas no lo detectaron porque siempre corren en `localhost`.
- **Arreglo:** el nuevo `utiles/idTemporal.ts` arma el id con `crypto.getRandomValues`, que está disponible en cualquier contexto. El servidor acepta cualquier texto de 1 a 100 caracteres, así que no cambia.
- **Prueba:** `chatStore.test.ts` envía un mensaje con un `crypto` sin `randomUUID`. Con el código anterior falla con "crypto.randomUUID is not a function", y con el arreglo pasa.
- **Verificación:** lint pasa y las 191 pruebas del frontend pasan.

## 2026-10-14 21:16 — Merge del PR #21

- Con la autorización del usuario, el PR #21 ("Registrar en el LOG el merge del PR #20") se mergeó a `main` en `e22f516`, fijando la cabeza verificada `0898a74`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-14 21:21 — Merge del PR #22

- Con la autorización del usuario, el PR #22 ("Chat: id temporal sin crypto.randomUUID, que falta fuera de HTTPS") se mergeó a `main` en `6a79294`, fijando la cabeza verificada `2eea52f`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-14 21:33 — Rediseño después de probar la app: crear grupo, Resumen, calendario y quiénes pagan

- **Pedido del usuario:** después de probar la app en su laptop, pidió cambios en crear un grupo (pocas ayudas y un destino ambiguo), el Resumen (demasiada información junta), Participantes (no tiene que estar en Inicio), el Cronograma y el Mapa (con viajes largos, demasiados días en pantalla) y el selector de quiénes pagan (sin estructura). Respondió las preguntas del plan y lo aprobó:
  - **Destino:** ciudad y país, guardados juntos.
  - **Crear grupo:** textos de ayuda, paso a paso e invitar al crear.
  - **Resumen:** basarse en cómo lo encaran otras apps.
  - **Itinerario:** un calendario del mes.
- **Crear grupo en tres pasos** (`DialogoNuevoViaje`):
  - **"¿A dónde van?":** nombre, ciudad y país opcional. El destino se guarda como "Ciudad, País", así que la base de datos y la API no cambian.
  - **"¿Cuándo?":** fechas y moneda, con textos de ayuda. Al terminar este paso se crea el viaje.
  - **"¿Con quién?":** reutiliza `FormularioAgregarViajero` sobre el viaje ya creado, así un email que falla no deja el viaje a medias. Cerrar el diálogo en este paso también lleva al viaje.
  - `CampoFormulario` acepta un texto de ayuda, enlazado con `aria-describedby`.
- **Resumen en una columna**, con lo que se tomó de la investigación (la vista general de Wanderlog con una sola acción destacada, la revelación progresiva y la guía de NN/g sobre acordeones en celular):
  - **"Lo próximo":** el paso más importante, destacado; los demás quedan en "Ver 2 pasos más".
  - **Progreso:** compacto, con "Ver los hitos" desplegable.
  - **Cuenta regresiva:** sale del Resumen y pasa a la portada, más grande y justo debajo del nombre.
- **Participantes:** se abre desde "4 viajeros" en la portada, e Inicio queda solo con el Resumen. Con acceso solo a saldos, ese dato no es un enlace.
- **Calendario compartido** (`CalendarioViaje`, que reemplaza a `SelectorDia`):
  - el mes de lunes a domingo, con los días del viaje elegibles, un punto en los que tienen actividades, hoy marcado, flechas si el viaje abarca dos meses y navegación con las flechas del teclado;
  - el Cronograma muestra el día elegido y el Mapa su recorrido;
  - el día va en `?dia=` y las pestañas lo conservan;
  - sin `?dia=`, se aplica la regla de RN-M1 (`diaInicial` en `utiles/fechas.ts`).
- **Quiénes pagan** (`SelectorDeudores`): una fila por persona, con la inicial, el nombre y la casilla; la elegida se resalta. Un contador "2 de 4" acompaña al botón de todos. RN-G3 no cambia.
- **Detalle:** el título del día en el cronograma decía "Viernes 11 Dic"; ahora dice "Viernes 11 dic".
- **PLAN.md:**
  - RN-C1 y RN-C4 se actualizaron, con la aprobación del usuario: el calendario muestra todos los días, el detalle se ve de a uno y se abre en hoy en lugar de desplazarse;
  - también se actualizaron RN-M7, la navegación de la sección 7.1, la tabla de rutas y 7.1.1;
  - `docs/diagramas.drawio` no cambia, porque solo modela el dominio y los casos de uso.
- **Verificación:**
  - lint pasa;
  - la cobertura pasa 558 pruebas: 349 del backend y 209 del frontend, con 93,1 % de líneas en el frontend;
  - la e2e pasa 8 de 8, con el flujo nuevo de crear grupo e invitar, y con el día compartido entre Cronograma y Mapa;
  - `knip` muestra solo sus falsos positivos conocidos;
  - las capturas a 360 px y 1280 px, en claro y oscuro, no muestran errores de consola propios.

## 2026-10-14 21:39 — Merge del PR #23

- Con la autorización del usuario ("Sí, hacé el commit y mergealo si pasa el CI"), el PR #23 ("Rediseño después de probar la app: crear grupo, Resumen, calendario y quiénes pagan") se mergeó a `main` en `35a8a9c`, fijando la cabeza verificada `839d9e3`. El CI pasó los tres trabajos, sin conflictos ni comentarios.
- Después del merge se dejó de seguir el PR, se borró la revisión programada y la rama se alineó con `main` por avance directo.

## 2026-10-14 22:02 — Merge del PR #24

- Con la autorización del usuario ("Sí, mergealo si pasa el CI"), el PR #24 ("Registrar en el LOG el merge del PR #23") se mergeó a `main` en `bca8524`, fijando la cabeza verificada `e586350`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-14 22:02 — Revisión: viaje duplicado, prueba en red y vulnerabilidades de Prisma

- **Pedido del usuario:** "Fijate si hay más cosas para mejorar o arreglar". De los hallazgos, eligió arreglar tres: el viaje duplicado, documentar la prueba en red y las vulnerabilidades de Prisma. Descartó que la API acepte `localhost` y la IP a la vez.
- **Viaje duplicado:**
  - **Problema:** en `DialogoNuevoViaje`, si el viaje se creaba pero fallaba algo posterior (recargar la lista o abrir el viaje), el diálogo quedaba en el paso 2 con el error, y "Crear viaje" creaba un segundo viaje igual.
  - **Arreglo:** `useViajeStore.crearViaje` ya no informa como fallida la creación si solo falla recargar la lista. El diálogo recuerda el viaje creado y, al reintentar, solo vuelve a abrirlo. Con el viaje ya creado, el botón "Atrás" desaparece.
  - **Prueba:** abrir el viaje falla una vez y reintentar no llama de nuevo a crear. Con el código anterior la prueba falla.
- **Prueba en red:**
  - **`npm run dev:red`** (`scripts/dev-red.js`): busca la IP de la red local, sin contar las interfaces de Docker, WSL ni máquinas virtuales, y se puede indicar a mano con `IP_RED`. La usa como `ORIGEN_WEB` y hace que Vite atienda a la red con `WEB_EN_RED`, que lee `vite.config.ts`.
  - **README:** suma la sección "Probar desde el celular u otra compu" y la fila del script.
  - **PLAN:** la sección 3 lo menciona, junto con la pauta de no depender de funciones que el navegador solo ofrece con HTTPS.
  - **Verificado en este entorno:** Vite atendió en la IP, y entrando por ella (contexto no seguro, sin `crypto.randomUUID`) el inicio de sesión y el envío de un mensaje en el chat funcionaron sin errores. Sin la variable, Vite sigue atendiendo solo en `localhost`.
- **Vulnerabilidades de Prisma:**
  - `npm audit` marcaba 4 "high": `deepmerge-ts` < 8 y `mysql2` ≤ 3.23, dependencias internas de la herramienta de línea de comandos de Prisma, que es de desarrollo.
  - `npm audit fix --force` proponía bajar Prisma a la 6. En lugar de eso, `overrides` en el `package.json` raíz fuerza `mysql2` ^3.24.6 y `deepmerge-ts` ^8.0.2. El lockfile solo cambia esos dos paquetes y sus dependencias.
  - Con eso, `npm audit` da 0 vulnerabilidades, y `prisma generate`, `prisma validate` y `prisma migrate status` funcionan.
- **Verificación:**
  - lint pasa;
  - la cobertura pasa 559 pruebas: 349 del backend y 210 del frontend, con 93,2 % de líneas en el frontend;
  - la e2e pasa 8 de 8;
  - `knip` muestra solo sus falsos positivos conocidos.

## 2026-10-14 22:19 — Merge del PR #25

- Con la autorización del usuario ("Sí, hacé el commit y mergealo si pasa el CI"), el PR #25 ("Viaje duplicado al reintentar, npm run dev:red y vulnerabilidades de Prisma") se mergeó a `main` en `92e009d`, fijando la cabeza verificada `5bdd3b4`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-14 22:19 — Más lugar para el contenido en celular

- **Pedido del usuario:** "Fijate si hay más cosas para mejorar o arreglar". De la revisión, eligió las dos mejoras propuestas para celular.
- **Problema:** en las capturas a 360 px, el encabezado fijo se partía en dos líneas y medía unos 70 px. La portada del viaje ocupaba unos 330 px de los 780 en cada sección, así que en el Cronograma, el Mapa o Gastos el contenido arrancaba a mitad de pantalla.
- **Encabezado** (`App.vue`): en celular, la marca dice "Viajes" en lugar de "Organizador de viajes", el nombre de quien usa la app se oculta y nada se parte en dos líneas. Mide 61 px. En escritorio no cambia.
- **Portada compacta** (`ViajeLayout.vue`, clase `portada--compacta`): en celular, fuera del Resumen, quedan solo "← Mis grupos", el nombre y la cuenta regresiva en una línea. Mide 113 px. La portada completa, con destino, fechas y "4 viajeros", sigue en el Resumen y en escritorio.
- **Pruebas nuevas:**
  - la marca tiene el texto largo y el corto;
  - la portada es compacta en el Cronograma y completa en el Resumen.
- **PLAN.md 7.1:** se actualiza la descripción de la portada y del encabezado en celular.
- **Capturas:** a 360 px en claro y oscuro, y a 1280 px en claro, del listado, el Resumen, el Cronograma y Gastos, sin errores en la consola.

## 2026-10-14 22:46 — Merge del PR #26

- Con la autorización del usuario ("Sí, hacé el commit y mergealo si pasa el CI"), el PR #26 ("Celular: encabezado en una línea y portada compacta fuera del Resumen") se mergeó a `main` en `f3dc79e`, fijando la cabeza verificada `2c71668`. El CI pasó los tres trabajos, sin conflictos ni comentarios.
- **Rama:** el usuario pidió no armar un plan para ese paso. La rama alineada con `main` se subió junto con el merge, y así se le avisó.

## 2026-10-14 22:46 — Chat y saldos en celular, Escape en los diálogos y pruebas exploratorias

- **Pedido del usuario:** "Fijate si hay más cosas para mejorar o arreglar". Aprobó los tres arreglos propuestos y pidió además pruebas para buscar cosas que fallen.
- **Chat: la barra inferior tapaba "Enviar".**
  - **Problema:** se midió en 360×780, 390×844 y 360×640, y la barra cubría 13 px del botón y del campo para escribir.
  - **Arreglo:** en celular, la lista de mensajes resta `--alto-barra-inferior` a su alto. El botón queda unos 50 px por encima de la barra y la página ya no se desplaza.
- **Chat: hora de los mensajes.** Pasó de "24/9, 09:26 p. m." a "24 sep, 21:26", con 24 horas y el mes abreviado, sin partirse. Lo arma `formatearMomento` en `utiles/formato.ts`.
- **Saldos:**
  - se quitó el "·" que quedaba colgando en "Debo ·" y "Me deben ·", y los dos puntos quedan solo para lectores de pantalla;
  - un total en cero va en gris, en lugar de rojo o verde.
- **Pruebas exploratorias** (spec temporal de Playwright, que se borró después de usarla):
  - **API:** unos 60 pedidos con datos raros (fechas inválidas o invertidas, textos de 1000 caracteres, montos negativos, decimales o enormes, ids inexistentes o mal formados, coordenadas incompletas, horarios fuera de rango, divisiones que no suman), pagos y votos simultáneos, un pedido sin `Origin` y un usuario ajeno. Ningún 500, los pagos simultáneos no aceptan más que la deuda y lo ajeno se rechaza.
  - **Interfaz a 360 px:**
    - crear un viaje de dos meses con doble clic (crea uno solo);
    - un `?dia=` inválido o fuera del viaje;
    - un viaje inexistente;
    - chat vacío, de 2100 caracteres y con HTML;
    - gasto con montos inválidos y partes que no suman;
    - formularios vacíos;
    - salir del grupo;
    - cerrar la sesión en otra pestaña.
    Sin errores en la consola ni el aviso "Algo salió mal", y nada se sale de la pantalla.
  - **Falla encontrada: Escape no cerraba el diálogo de crear grupo después de agregar a alguien.** Al deshabilitarse el botón "Agregar" mientras espera, el navegador le saca el foco y lo deja fuera del diálogo, y `DialogoModal` escuchaba Escape solo adentro. Ahora lo escucha en todo el documento mientras está abierto. La prueba nueva falla con el código anterior.

## 2026-10-14 22:54 — Volver desde un viaje sin acceso, avisos de la lista y prueba de robustez

- **Pedido del usuario:** de los detalles que encontraron las pruebas exploratorias, aprobó el enlace para volver, el aviso al salir y dejar la prueba de la API como permanente.
- **Enlace para volver:** si el viaje no existe o no participás, `ViajeLayout` muestra "← Volver a mis grupos" debajo del error.
- **El aviso al ser quitado nunca se veía.** Apareció al preparar el aviso al salir y se reprodujo en el navegador antes de arreglarlo.
  - **Causa:** `cerrarPorBaja` escribía "El Admin te quitó de…" en `store.aviso` y navegaba a la lista. Al cerrarse, `ViajeLayout` borraba ese mismo campo antes de que `ViajesVista` lo mostrara.
  - **Arreglo:** el store separa `aviso` (dentro del viaje) de `avisoLista` (para la lista). `ViajeLayout` solo borra el suyo.
- **Aviso al salir:** quien sale sin saldos pendientes ve "Saliste de «Bariloche 2026»." en la lista.
- **Pruebas:**
  - **Unitarias:** el enlace para volver, que `avisoLista` sobrevive al cierre del viaje y el aviso al salir.
  - **E2E `administracion.spec.ts`:** suma la verificación del aviso al salir y un flujo nuevo, en el que el Admin quita a alguien que está mirando el chat. Esa persona vuelve a la lista con el aviso y, al reabrir el viaje, tiene el enlace para volver.
  - **E2E nuevo `robustez.spec.ts`:**
    - unos 50 pedidos inválidos a la API, que tienen que responder 4xx y nunca 5xx;
    - un pedido sin `Origin`, que se rechaza;
    - un usuario ajeno, que no ve los gastos;
    - tres pagos simultáneos por el total de la deuda, de los que solo se acepta uno.

## 2026-10-14 23:19 — Merge del PR #27

- Con la autorización del usuario ("Sí, PR y merge si pasa"), el PR #27 ("Chat y saldos en celular, Escape en diálogos, avisos de la lista y E2E de robustez") se mergeó a `main` en `397166e`, fijando la cabeza verificada `bea1f90`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-14 23:19 — Diseño inspirado en WhatsApp, Mercado Pago y Discord

- **Pedido del usuario:** reevaluar el diseño tomando como inspiración WhatsApp, Mercado Pago, Playus, Discord y apps parecidas, evitando el plagio, y elegir de una lista de 18 ideas.
  - Eligió 1, 2, 3, 5, 6, 7, 8, 10, 11, 12 y 17.
  - Decidió hacer primero las de solo interfaz y dejar para otro PR las de backend (3, 11 y 12), con estas definiciones: "sin leer" cuenta solo mensajes del chat y las reacciones van solo en mensajes.
  - Para el 10 pidió fotos de perfil en otro release.
  - Aprobó el plan y que se sumen las historias al story map.
- **Chat (1 y 2):** `ListaMensajes` arma filas con separadores de día (`etiquetaDelDia`) y agrupa los mensajes seguidos de la misma persona, a menos de 5 minutos. La hora (`formatearHora`) va dentro de la burbuja. `CampoMensaje` crece hasta unos cinco renglones y "Enviar" es un botón redondo con un ícono nuevo, con `aria-label`. `formatearMomento` se reemplazó por estas dos funciones.
- **Cuentas como billetera (5 y 6):**
  - `GastosVista` muestra el balance neto (lo que te deben menos lo que debés), con accesos rápidos a Anotar gasto, Pagar y Me deben. "Me deben" abre Saldos en esa pestaña con `?ver=meDeben`.
  - La "Actividad" agrupa los gastos por día. `TarjetaGasto` pasa a ser una fila con el ícono de la categoría (íconos nuevos: comida, transporte, compras), quién pagó y tu parte, y el reparto se despliega al tocarla.
  - Los pagos no entran en la actividad: la API solo devuelve los de deudas abiertas, así que el historial quedaría incompleto. Sumarlos requiere backend.
- **Comprobante (7):** `PagoVista` muestra el comprobante en lugar de volver a Saldos. Tiene una tilde, el monto, a quién, la fecha, lo que queda por pagar y el botón "Listo". Se quitó `gastos.mensaje`, que dejó de usarse.
- **Monto protagonista (8):** la clase global `.monto-grande` tiene el símbolo de la moneda (`simboloMoneda`) y el número grande y centrado. Se usa en anotar gasto, donde el monto pasa a ir después del título, y en pagar.
- **Participantes por rol (10):** `ListaParticipantes` agrupa en "Admin" y "Viajeros (n)". El nuevo `InicialPersona` es el círculo con la inicial y lo comparten con `SelectorDeudores`; ahí irían las fotos de perfil.
- **Botón flotante (17):** `.accion-flotante` en "Proponer alojamiento" y "Proponer actividad". En celular flota encima de la barra, con el texto oculto pero disponible para lectores de pantalla. En Gastos, la acción principal ya está en los accesos rápidos.
- **Story map** (`docs/diagramas.drawio`, Página-13):
  - en el R5, en la columna "Comunicarse", se agregaron "Viajero reacciona con un emoji a un mensaje del chat", "Viajero ve quién está escribiendo en el chat" y "Viajero ve en la lista de grupos la última novedad y los mensajes sin leer";
  - en el R6, en "Gestionar el grupo", se agregó "Viajero sube su foto de perfil";
  - para hacerles lugar, todo lo que está debajo del R5 bajó 240 px.
- **PLAN.md:** se actualizaron la sección 7.1.1 (los patrones nuevos y las funciones de fecha) y la sección 9 (R5 y R6, con cómo encajan las historias nuevas).
- **Pruebas:**
  - **Nuevas:** `ListaMensajes.test.ts`, `GastosVista.test.ts`, el comprobante, `?ver=meDeben`, `simboloMoneda`, `etiquetaDelDia` y `formatearHora`, y los grupos por rol.
  - **Ajustadas:** las E2E de gastos (la fila desplegable y el comprobante) y de administración (el grupo Admin).
- **Verificación:**
  - lint pasa;
  - la cobertura pasa 573 pruebas: 349 del backend y 224 del frontend, con 94 % de líneas en el frontend;
  - la e2e pasa 11 de 11;
  - las capturas a 360 px en claro y oscuro y a 1280 px, del chat, Gastos, anotar gasto, el pago con su comprobante, Participantes y Actividades, no muestran errores en la consola.

## 2026-10-15 02:33 — Merge del PR #28

- Con la autorización del usuario ("Sí, hacé el commit y mergealo si pasa el CI"), el PR #28 ("Diseño inspirado en WhatsApp, Mercado Pago y Discord: chat, billetera, comprobante, participantes y botón flotante") se mergeó a `main` en `697804c`, fijando la cabeza verificada `178a819`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-15 02:33 — Pagos en la Actividad, arreglo del gateway del chat y Release 5 guardado aparte

- **Pedido del usuario:** se implementó el plan de los puntos con backend (3, 11 y 12) y de los pagos en la Actividad.
  - Al terminar, el usuario pidió que en el MVP quede solo lo que el story map tiene en el MVP, para no cambiar ni probar más cosas.
  - Pidió guardar lo demás para no rehacerlo cuando llegue su release, y eligió una rama en GitHub.
- **Release 5 guardado:** la lista de grupos como chats (novedades y mensajes sin leer), las reacciones y "escribiendo…", con su migración, pruebas y documentación, quedaron en la rama `claude/release-5-mensajeria` (commit `d980a34`), sin PR. La sección 9 de PLAN.md lo indica en la fila del R5.
- **Pagos en la Actividad (MVP, CU23 y RN-P6):**
  - `GET /api/viajes/:viajeId/pagos` devuelve los pagos donde quien consulta es deudor o acreedor, incluidos los de deudas saldadas (`ConsultaSaldos.pagosDe`, con la guarda de saldos);
  - `GastosVista` los mezcla con los gastos por fecha, con la fila nueva `FilaPago` ("Tomás te pagó", "Le pagaste a Tomás");
  - RN-P6 suma que el pago aparece en la Actividad de los dos y que nadie más lo ve.
- **Error del gateway del chat:** en `manejar`, `confirmar?.({ ...(await accion()) })` no ejecutaba la acción cuando el evento llegaba sin confirmación, porque el encadenamiento opcional no evalúa el argumento.
  - En el MVP esto afectaba a `chat:salir`, que el navegador manda sin confirmación: la conexión nunca salía de la sala del viaje anterior.
  - Se separó la llamada. La prueba nueva de integración falla sin el arreglo y pasa con él.
- **Pruebas:**
  - contratos de `pagosDe` en memoria y Prisma, incluidas las deudas saldadas;
  - `GET /pagos` con privacidad en `pagos.bd.test.ts`;
  - `chat:salir` sin confirmación en `chat.bd.test.ts`;
  - pagos en `GastosVista.test.ts`;
  - en las E2E, el pago aparece en la Actividad de los dos (`gastos.spec.ts`) y `GET /pagos` no es accesible para alguien ajeno al viaje (`robustez.spec.ts`).

## 2026-10-15 03:00 — Merge del PR #29

- Con la autorización del usuario ("Sí, PR y merge si pasa"), el PR #29 ("Pagos propios en la Actividad de Cuentas y arreglo de los eventos del chat sin confirmación") se mergeó a `main` en `75a4f3d`, fijando la cabeza verificada `716e803`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-15 03:00 — Revisión del alcance contra el MVP del story map

- **Pedido del usuario:**
  - revisar qué se implementó que no está en el MVP o que se metió en el MVP sin una historia propia;
  - guardar en una rama lo que no es del MVP;
  - listar lo que se agregó, para decidir punto por punto.
- **Fuera del MVP en `main`:** solo "Viajero ve el progreso del viaje, los próximos pasos y la cuenta regresiva", del Release 10, implementada en el PR #19. El usuario decidió que quede en `main`.
- **Agregados sin historia propia:** se revisaron uno por uno y todos quedan en `main`:
  - pagos en la Actividad;
  - billetera de Cuentas;
  - comprobante al pagar;
  - invitar al crear el grupo;
  - calendario compartido;
  - crear grupo en tres pasos;
  - navegación en cinco grupos;
  - modo oscuro;
  - validación al salir de cada campo;
  - chat estilo WhatsApp;
  - participantes por rol;
  - selector de quiénes pagan;
  - monto grande;
  - botón flotante;
  - portada del viaje;
  - paleta e íconos de línea.
- **Release 5:** las reacciones, "escribiendo…" y la lista de grupos con novedades y mensajes sin leer siguen guardadas en `claude/release-5-mensajeria`.
- **Story map** (`docs/diagramas.drawio`, Página-13): la tarjeta del progreso pasó del Release 10 al MVP, en la columna "Gestionar el grupo" (x=430, y=830), con los colores del MVP.
- **PLAN.md:** se actualizaron la sección 7.1.1, la fila del R10 en la sección 9 y la tabla de 10.2.

## 2026-10-15 11:28 — Merge del PR #30

- Con la autorización del usuario ("Sí, aplicalo y mergealo si pasa el CI"), el PR #30 ("Story map: el progreso del viaje pasa del Release 10 al MVP") se mergeó a `main` en `57299c9`, fijando la cabeza verificada `6f79714`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-15 11:28 — Revisión con datos largos: mensajes en castellano, montos de millones y palabras sin espacios

- **Pedido del usuario:** "Fijate si hay más cosas para mejorar o arreglar".
- **Revisión:**
  - **Bases:** `npm audit` da 0 vulnerabilidades, `jscpd` encuentra 36 clones (1,1 %, sin cambios) y el error del PR #29 (`confirmar?.(…await…)`) no se repite en otro lugar.
  - **Recorrido:** se recorrieron todas las pantallas a 360 px con datos al máximo permitido y con datos largos realistas.
  - **Lo que quedó como está:** TypeScript 7 (versión mayor recién salida, con el compilador reescrito) y Prisma 8, que todavía es preliminar.
- **Hallazgos y arreglos, elegidos por el usuario:**
  - **Mensajes en inglés:** los largos máximos no tenían mensaje propio y se veía "Too big: expected string to have <=120 characters".
    - `LARGOS_MAXIMOS` en `packages/compartido` centraliza los límites, con el mensaje "Puede tener hasta N caracteres". También se agregaron mensajes para la contraseña al ingresar y para el precio.
    - Cada campo lleva `maxlength`. En "Nuevo grupo", la ciudad (70) y el país (48) suman, con ", ", los 120 del destino.
  - **Montos de millones:**
    - el balance de la billetera usa `clamp(1.5rem, 8vw, 2.25rem)`;
    - los totales de Saldos se achican según su largo dentro de la pestaña (`--largo` y `cqi`), así "$ 0,00" conserva su tamaño y "$ 11.111.111,01" entra en un renglón a 360 px.
  - **Filas de la Actividad y de Saldos:** con `flex-wrap`, el monto baja al renglón siguiente solo cuando no entra al lado del título o del nombre.
  - **Palabras sin espacios:** `overflow-wrap: anywhere` en `body`. Los montos que podían partirse por esa regla se revisaron uno por uno.
- **Ajuste durante la implementación:** con el título a 9rem, los montos normales de los pagos bajaban de renglón sin necesidad, así que se pasó a 7rem.
- **Pruebas:**
  - los mensajes de largo en castellano, en la web y en `POST /viajes`;
  - `maxlength` en "Nuevo grupo" y en anotar gasto;
  - una e2e nueva en `diseno.spec.ts` con datos largos a 360 px, que falla sin estos arreglos y pasa con ellos.
- **Diagramas:** no cambian, porque el cambio es de validación y presentación.

## 2026-10-15 12:05 — Merge del PR #31

- Con la autorización del usuario ("Sí, hacé el commit y mergealo si pasa el CI"), el PR #31 ("Mensajes de largo en castellano y textos y montos largos en celular") se mergeó a `main` en `51d2049`, fijando la cabeza verificada `bda0802`. El CI pasó los tres trabajos, sin conflictos ni comentarios.
- El usuario pidió que, cuando apruebe un commit con merge, se haga directamente, sin presentar un plan para ese paso.

## 2026-10-15 12:05 — Revisión de accesibilidad con axe

- **Pedido del usuario:** "Cuando termines, fijate si hay más cosas para mejorar o arreglar".
- **Revisión:**
  - **Seguridad:** `helmet`, sin `x-powered-by`, y cookies `httpOnly`, `SameSite=Lax` y `secure` en producción.
  - **Carga:** cada ruta se carga por separado y la parte común pesa 59 kB comprimida.
  - **Base de datos:** la única consulta dentro de un bucle es la que bloquea las opciones de una actividad en orden, a propósito.
  - **Accesibilidad:** axe-core, descargado en el scratchpad y fuera del repositorio, recorrió 14 pantallas en claro, oscuro, 360 px y 1280 px.
- **Hallazgos y arreglos, elegidos por el usuario:**
  - **Contraste del calendario:** los días fuera del viaje tenían 2,67:1 por `opacity: 0.6`. Ahora usan el gris secundario sin transparencia (más de 4,5:1) y se siguen distinguiendo por el peso y la falta de fondo.
  - **Crédito del mapa:** el enlace "Leaflet" tenía 2,55:1 contra el texto de alrededor, sin subrayado. Ahora va subrayado y con el color del texto, en los dos modos.
  - **Prueba de accesibilidad:** `@axe-core/playwright` como dependencia de desarrollo y `e2e/accesibilidad.spec.ts`, que recorre 13 pantallas en claro a 1280 px y en oscuro a 360 px. Falla sin estos arreglos y pasa con ellos.
- **Documentación:** PLAN.md 7.1.1 y `docs/auditoria.md` (sección 1).

## 2026-10-15 12:21 — Merge del PR #32

- Con la autorización del usuario ("Sí, hacé el commit y mergealo si pasa el CI"), el PR #32 ("Accesibilidad: contraste del calendario y del crédito del mapa, y e2e con axe") se mergeó a `main` en `c3768af`, fijando la cabeza verificada `6c86df5`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-15 12:21 — Foco dentro de los diálogos y viajes terminados al final de la lista

- **Pedido del usuario:** "Fijate si hay más cosas para mejorar o arreglar".
- **Revisión:** se exploraron con Playwright el teclado en los diálogos, el orden de la lista con un viaje terminado y la entrada a un viaje inexistente.
- **Hallazgos y arreglos, elegidos por el usuario:**
  - **Foco en los diálogos:** con Tab, al sexto intento el foco salía de "Nuevo grupo" a la página tapada ("Saltar al contenido", "Cerrar sesión"). Ahora `DialogoModal` hace que Tab y Mayús + Tab den la vuelta dentro del diálogo y devuelve el foco si quedó afuera, según el patrón de diálogo modal de WAI-ARIA. Recorrido en el navegador: con diez Tab y diez Mayús + Tab, el foco no sale del diálogo.
  - **Orden de la lista:** un viaje terminado en marzo de 2025 quedaba arriba del que se está organizando. Ahora van primero los viajes en curso y los próximos, por fecha de inicio, y al final los terminados, del más reciente al más viejo. Solo cambia la web.
- **Lo que quedó como está:** entrar a un viaje inexistente dice "No participás de este viaje", porque la API responde igual que para un viaje ajeno y así no revela qué viajes existen.
- **Pruebas:** `DialogoModal.test.ts` (Tab y Mayús + Tab, también con el foco afuera) y `ViajesVista.test.ts` (orden con viajes terminados, en curso y próximos).
- **PLAN.md:** se actualizaron 7.1.1 (teclado) y la ruta `/viajes` de 7.3.

## 2026-10-15 12:43 — Errores de carga con "Reintentar" y límite de mensajes en el chat

- **Pedido del usuario:** "Seguí buscando cosas para arreglar o mejorar, así hacemos commits más significativos". Estos arreglos van en el mismo PR que los del foco en los diálogos y el orden de la lista.
- **Revisión:** con Playwright se cortaron los pedidos a la API de cada pantalla y se probó enviar muchos mensajes seguidos en el chat.
- **Hallazgos y arreglos, elegidos por el usuario:**
  - **Datos falsos al fallar:** sin conexión, Saldos mostraba "$ 0,00" y "No le debés nada a nadie", y el Chat "Todavía no hay mensajes". Ahora las dos pantallas muestran solo el error hasta que los datos llegan.
  - **Botón "Reintentar":** los errores de carga de la lista de viajes, el viaje, Resumen, Participantes, Alojamientos, Actividades, Cronograma, Mapa, Chat, Gastos y Saldos ofrecen "Reintentar" cuando falló la conexión o el servidor. Ante un rechazo de la API, como "No participás de este viaje", no se ofrece porque daría lo mismo. La lógica quedó en el composable `useCarga`, y `AvisoMensaje` recibe la prop `reintentar`.
  - **Límite del chat:** cada conexión puede enviar hasta 10 mensajes cada 10 segundos. El siguiente se rechaza con `DEMASIADOS_MENSAJES` y no se guarda; en la web queda marcado "No se pudo enviar" y aparece "Esperá unos segundos antes de seguir escribiendo", que se borra con el próximo envío que sale bien.
- **Pruebas:** `useCarga.test.ts` (composable y botón de `AvisoMensaje`), `SaldosVista.test.ts` y `ChatVista.test.ts` (error sin datos falsos y reintento), `chatStore.test.ts` (el aviso se borra) y `chat.bd.test.ts` (límite por conexión que se libera al pasar la ventana; falla sin el límite). En el navegador se probaron Saldos, Chat y Alojamientos sin conexión y el límite del chat.
- **Verificación:** lint, 354 pruebas de la API, 235 de la web y 13 e2e en verde; knip solo informa los falsos positivos conocidos.
- **PLAN.md:** 5.8 (`chat:enviar`) y 7.1.1 (errores de carga).

## 2026-10-15 20:15 — Merge del PR #33

- Con la autorización del usuario ("Sí, hacé el commit y mergealo si pasa el CI"), el PR #33 ("Errores de carga con Reintentar, límite del chat, foco en diálogos y orden de la lista") se mergeó a `main` en `a45b958`, fijando la cabeza verificada `a065ae6`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-15 20:15 — Paleta verde azulado y coral, sin modo oscuro

- **Pedido del usuario:** "Hay que cambiar el diseño a uno más amigable para todo el mundo, así que tenemos que cambiar los colores y sacar el modo oscuro, porque lo que tenemos ahora es muy de personas de IT". Solo cambian los colores; tipografía, formas e íconos quedan.
- **Cómo se eligió:**
  - se probaron sobre la app real 19 paletas: de un color, de dos colores "viajeras" y con el contraste de Booking (barra oscura, botones de tono medio y un color brillante para los detalles);
  - se compararon por lo que transmiten, si se distinguen de los colores de estado, cómo las ve una persona con daltonismo y el parecido con apps conocidas;
  - el usuario pidió el estilo de contraste de Booking con otros colores y lo limpio de Wanderlog, y eligió "laguna y coral".
- **Cambios:**
  - `App.vue`: fondo blanco, verde azulado (`#0a6a77`) para acciones y enlaces, barra de arriba verde azulado oscuro (`#083a46`) con texto blanco y coral (`#ff8f6b`) para los detalles; variables nuevas `--color-barra`, `--color-destacado` y sus colores de texto. "Pendiente" pasa de amarillo a naranja tostado para separarse del coral. Se sacó el modo oscuro: la app se ve clara aunque el sistema esté en oscuro.
  - En coral: la cuenta regresiva y la franja de la portada (`ViajeLayout`), la franja de las tarjetas de la lista (`ViajesVista`), el anillo de progreso (`AnilloProgreso`), el ícono de la marca y el botón flotante en celular. Nunca en montos ni en estados.
  - En la barra oscura, "Cerrar sesión" va con borde blanco y el foco del teclado se dibuja en blanco.
- **Divergencia con PLAN.md, aprobada por el usuario:** 7.1.1 decía que el turquesa era el único color, que ninguno debía sugerir clima y que había modo oscuro. Se reescribió con el criterio nuevo.
- **Pruebas:** `e2e/accesibilidad.spec.ts` sigue pasando axe a 1280 px y a 360 px; en celular, con el sistema en modo oscuro, para confirmar que la app se ve clara. Lint, 235 pruebas de la web y 13 e2e en verde.

## 2026-10-15 20:37 — Merge del PR #34

- Con la autorización del usuario ("Si"), el PR #34 ("Paleta verde azulado y coral, sin modo oscuro") se mergeó a `main` en `14944cc`, fijando la cabeza verificada `2cb00e1`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-15 20:37 — Limpieza de código muerto

- **Pedido del usuario:** "revisa si hay código muerto y sacalo", como paso previo a la reorganización de carpetas.
- **Revisión:**
  - knip en modo normal y en modo producción, con una configuración temporal fuera del repo que marca los puntos de entrada, para encontrar código que solo usan las pruebas;
  - scripts para clases CSS sin uso, datos y funciones de los stores, métodos de los clientes de la web, props de los componentes, rutas de la API sin llamar, métodos del servidor, exportaciones del paquete compartido y campos de la base;
  - búsqueda de restos del Release 5 y de código comentado.
- **Lo que se sacó, elegido por el usuario:**
  - `Propuesta.conteo()` y `Dinero.esCero()`, que solo usaban las pruebas (los conteos de votos salen de la consulta a la base); sus pruebas ahora verifican los votos y el monto directamente;
  - los tipos `DatosAgregarViajero`, `DatosSalirDelViaje`, `DatosTraspaso` y `DatosVoto` del paquete compartido, que nadie usaba;
  - `cargada` deja de exponerse desde el store de sesión y queda como dato interno.
- **Lo que parece muerto y no lo es:** `e2e/soporte/prepararBase.ts`, `pg`, `@types/pg` y `@prisma/client` (falsos positivos de knip); la columna `verificada_en`, reservada para la verificación de email (PLAN.md, extensiones) y presente en el diagrama de clases; y las exportaciones que usa el propio código además de las pruebas.
- **Sin hallazgos:** clases CSS, restos del Release 5, rutas de la API, métodos de los clientes, props y código comentado.
- **Verificación:** lint, 354 pruebas de la API y 235 de la web en verde.

## 2026-10-15 20:56 — Merge del PR #35

- Con la autorización del usuario ("Si"), el PR #35 ("Sacar código muerto") se mergeó a `main` en `2ba4ba9`, fijando la cabeza verificada `e811e43`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-15 20:56 — Reorganización de carpetas y una clase por archivo

- **Pedido del usuario:** "Hay que cambiar la organización y nombres de las carpetas y archivos para que sea más intuitivo saber dónde está cada cosa y cómo están conectadas", y "no pueden haber dos entidades en un mismo archivo, deben estar separadas". Debe ser intuitivo para el usuario, que está aprendiendo el código.
- **Diagramas:** `docs/diagramas.drawio` tiene casos de uso, diagramas de actividad, el modelo conceptual y el mapa de historias; ninguno define carpetas, así que el cambio no los contradice. Viaje y Membresía, que el modelo conceptual muestra como entidades distintas, quedaron en archivos separados.
- **Decisiones del usuario:** web organizada por tipo con una carpeta por área; archivos de clases con minúscula inicial, como el resto del servidor; las interfaces de cada módulo siguen juntas en `dominio/puertos.ts`; `apps/api/src/compartido` pasa a `comun` para no confundirse con `packages/compartido`.
- **Servidor:**
  - las 78 clases quedaron una por archivo: de 75 a 129 archivos en `src`;
  - los archivos con varias clases (`casosDeUso<Módulo>.ts`, `infraestructura/prisma.ts`, `repositoriosPrisma.ts`, `adaptadores.ts`, `reglasDeResolucion.ts`, `division.ts`) se dividieron; `viaje.ts` se separó en `viaje.ts` y `membresia.ts`, y `socketIO.ts` en `gatewayChat.ts` y `notificadorViajeSocketIO.ts`;
  - lo que usan varias clases quedó en archivos con nombre descriptivo: `dependencias.ts`, `verificaciones.ts`, `modificarViaje.ts`, `cargarViaje.ts`, `exigirParticipante.ts`, `cuentaExistente.ts`, `esConfirmacionDeActividad.ts`, `estrategiaDivision.ts` y `filasPrisma.ts`;
  - tres archivos de una sola clase tomaron el nombre de su clase: `consultaItinerarioPrisma.ts`, `participacionSegunViajes.ts` y `propuestasConAgendaBloqueadaPrimero.ts`.
- **Web:**
  - `vistas/` tiene una carpeta por área (`sesion`, `viajes`, `alojamientos`, `actividades`, `itinerario`, `chat` y `gastos`);
  - `componentes/viaje` se unió a `componentes/viajes` y `componentes/mapa` pasó a `componentes/ubicacion`, porque tiene el selector de ubicación de los formularios y no el mapa del itinerario;
  - `stores/viaje.ts` pasó a `stores/viajes.ts`, como su cliente;
  - `test/` copia las carpetas de `src/`.
- **Cómo se hizo:** con `git mv` para conservar la historia y un script con el compilador de TypeScript, fuera del repositorio, que separó cada declaración con solo los imports que usa, exportó los ayudantes compartidos y reescribió los imports de todos los archivos, incluidos los `import()` del router y los `vi.mock()`. El código de las clases no cambió.
- **Verificación:** lint y tipos, 354 pruebas de la API, 235 de la web, 13 e2e, build de producción y las búsquedas de capas de `docs/auditoria.md`; knip solo informa los falsos positivos conocidos.
- **Documentación:** PLAN.md 2.4 (estructura y regla de archivos) y la ruta de `docs/auditoria.md`.
- **Rama `claude/release-5-mensajeria`:** traerla ahora implica rehacer sus cambios sobre la estructura nueva.

## 2026-10-19 16:51 — Merge del PR #36

- Con la autorización del usuario ("Si"), el PR #36 ("Reorganización de carpetas y una clase por archivo") se mergeó a `main` en `f8feb06`, fijando la cabeza verificada `b03868c`. El CI pasó los tres trabajos, sin conflictos ni comentarios.

## 2026-10-19 16:51 — Regla 7.1 de CLAUDE.md: qué va en cada mensaje

- **Pedido del usuario:** agregar a CLAUDE.md la regla sobre el contenido de los mensajes al terminar un cambio, como la próxima extensión numerada, sin modificar lo escrito y consultando cualquier contradicción.
- **Contradicción consultada:** la sección 1 pide resumir "qué se cambió" en un cambio menor. El usuario decidió que se entiende como qué cambia para quien usa el sistema, así que la sección 1 quedó igual.
- **Cambio:** CLAUDE.md suma la subsección 7.1 "Qué va en cada mensaje".
