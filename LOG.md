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
