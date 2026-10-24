---
version: alpha
name: Organizador de viajes en grupo
description: App web y móvil para que un grupo de amigos planifique un viaje juntos (alojamientos, actividades votadas, itinerario, chat y gastos compartidos). Interfaz en español rioplatense.
colors:
  primary: "#0A6A77"
  on-primary: "#FFFFFF"
  primary-container: "#DFF1F2"
  action: "#F2B53A"
  on-action: "#2B1D00"
  action-container: "#FDF1D6"
  action-outline: "#C98F17"
  top-bar: "#083A46"
  on-top-bar: "#FFFFFF"
  background: "#FAF6EE"
  surface: "#FFFDF8"
  surface-alt: "#F3EEE4"
  on-surface: "#1C2230"
  on-surface-variant: "#59606E"
  outline: "#DDD5C6"
  outline-strong: "#8A8478"
  success: "#15803D"
  success-container: "#DCFCE7"
  warning: "#9A4A00"
  warning-container: "#FFEDD8"
  error: "#B91C1C"
  error-container: "#FEE2E2"
  neutral: "#59606E"
  neutral-container: "#F3EEE4"
  dark-background: "#1F1F1F"
  dark-surface: "#333333"
  dark-surface-alt: "#3D3D3D"
  dark-on-surface: "#F2F2F2"
  dark-on-surface-variant: "#B8B8B8"
  dark-outline: "#6E6E6E"
  dark-outline-strong: "#9A9A9A"
  dark-primary: "#3FC3D8"
  dark-on-primary: "#062A30"
  dark-primary-container: "#1D3D42"
  dark-countdown: "#A9D5DD"
  dark-on-countdown: "#12343A"
  dark-success: "#62D48E"
  dark-warning: "#FFA463"
  dark-error: "#FF8099"
typography:
  display:
    fontFamily: Poppins
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.25
  h1:
    fontFamily: Poppins
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.25
  h2:
    fontFamily: Poppins
    fontSize: 1.375rem
    fontWeight: 700
    lineHeight: 1.25
  h3:
    fontFamily: Poppins
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.25
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.5
  badge:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: 600
    lineHeight: 1.4
  amount:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 700
    fontFeature: '"tnum"'
rounded:
  control: 10px
  card: 18px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  control-height: 44px
  bottom-bar-height: 64px
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.pill}"
    height: 44px
    padding: 8px 16px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.pill}"
    height: 44px
    padding: 8px 16px
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    rounded: "{rounded.pill}"
    height: 44px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: 16px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.control}"
    height: 44px
    padding: 8px 12px
  countdown-chip:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    typography: "{typography.h3}"
  badge-pending:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.warning}"
    rounded: "{rounded.pill}"
    typography: "{typography.badge}"
  badge-confirmed:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.success}"
    rounded: "{rounded.pill}"
    typography: "{typography.badge}"
  badge-denied:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.error}"
    rounded: "{rounded.pill}"
    typography: "{typography.badge}"
  badge-cancelled:
    backgroundColor: "{colors.neutral-container}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.pill}"
    typography: "{typography.badge}"
  top-bar:
    backgroundColor: "{colors.top-bar}"
    textColor: "{colors.on-top-bar}"
    height: 60px
---

## Overview

Organizador de viajes para grupos de amigos: proponen alojamientos y actividades, las votan, el Admin las confirma, ven el itinerario día por día y el mapa, chatean y reparten los gastos. Se usa sobre todo en el celular, durante semanas de planificación y durante el viaje mismo.

La interfaz tiene que sentirse como una libreta de viaje compartida y ordenada: cálida, clara y sin adornos. La información del viaje (fechas, horarios, quién propuso qué, cuánto debe cada uno) es la protagonista; el diseño la acompaña. Los textos son en español rioplatense, con voseo ("Proponé", "Anotá un gasto"), cortos y directos: dicen lo justo y necesario.

La app tiene modo claro (fondo crema) y modo oscuro ("Carbón", grises neutros); los dos usan la misma estructura y la misma mostaza para la acción principal.

## Colors

- **Primary (#0A6A77), verde azulado:** enlaces, pestaña y día elegidos, personas seleccionadas, hitos cumplidos. También acompaña al viaje: cuenta regresiva, franja superior de la portada y de las tarjetas de la lista de viajes. Su versión oscura (#083A46) es la barra superior, con texto blanco.
- **Action (#F2B53A), mostaza con texto oscuro (#2B1D00):** solo la acción principal de cada pantalla (botón principal, el paso destacado de "Lo próximo", "Anotar gasto", el botón flotante "+" en el celular y el ícono de la marca). Nunca se usa en montos ni en estados.
- **Background (#FAF6EE) y Surface (#FFFDF8):** fondo crema con tarjetas casi blancas. Surface-alt (#F3EEE4) para fondos de controles segmentados y filas al pasar el mouse.
- **Outline (#DDD5C6):** el borde de tarjetas y líneas entre renglones; Outline-strong (#8A8478) para bordes de campos y botones secundarios.
- **Estados (se reservan para esto):** verde (#15803D) confirmado y "te deben"; naranja tostado (#9A4A00) pendiente, que no es amarillo para separarse de la mostaza; rojo (#B91C1C) denegado, errores y "debés"; gris (#59606E) cancelado. Cada estado lleva también un ícono y su nombre: el color nunca es la única señal.
- **Modo oscuro "Carbón":** fondo #1F1F1F, tarjetas #333333 con borde visible #6E6E6E, celeste #3FC3D8 para enlaces y pestañas, celeste pastel #A9D5DD con texto #12343A para la cuenta regresiva, la misma mostaza, y estados más claros (verde #62D48E, naranja #FFA463, rosado #FF8099). La barra superior es del color del fondo con una línea gris debajo.
- Todo texto cumple WCAG 2.2 AA en los dos modos.

## Typography

Poppins (600–800) en los títulos y en los botones; Inter en el resto del texto, a 16 px con interlineado 1,5. Los montos y horarios usan cifras tabulares para que se alineen en columnas. El nombre del viaje es el título más grande de la pantalla. Etiquetas e insignias a 13 px en semibold.

## Layout

- **Celular primero (390 px).** Barra fija abajo con cinco destinos: Inicio, Planificar, Itinerario, Chat y Cuentas, con ícono y nombre. Dentro de un destino con varias secciones, un control segmentado arriba (por ejemplo Alojamientos / Actividades / Sin día). El botón flotante "+" va abajo a la derecha, encima de la barra.
- **Portada del viaje** arriba de cada pantalla: "← Mis grupos", el nombre, la cuenta regresiva justo debajo, destino, fechas y el botón de viajeros con engranaje. Fuera del Resumen se achica a una línea con el nombre y la cuenta regresiva.
- **Escritorio (desde 1024 px):** el viaje y los cinco destinos pasan a una barra lateral fija a la izquierda; el contenido usa el resto, en dos columnas cuando hay dos bloques. Los calendarios van siempre a la derecha del contenido, como ayuda y no como protagonista.
- Espaciado en múltiplos de 4 px; controles de 44 px de alto como mínimo para el dedo.

## Elevation & Depth

Plano. Las tarjetas se separan del fondo solo con su borde de 1 px, sin sombra, igual en claro y en oscuro. La sombra (0 10px 30px rgb(0 0 0 / 0.18)) queda para lo que flota encima: diálogos, menús desplegables, la barra inferior del celular y el botón flotante.

## Shapes

Tarjetas con esquinas de 18 px; campos de texto de 10 px. Botones, insignias de estado, la cuenta regresiva y los filtros son pastillas (999 px). La portada lleva una franja superior verde azulado de 6 px y un fondo de puntitos muy sutil.

## Components

- **Botón principal:** pastilla mostaza con texto oscuro y Poppins semibold. Uno solo por pantalla.
- **Botón secundario:** pastilla con fondo de tarjeta y borde fuerte. **Botón de peligro:** igual pero con texto y borde rojos ("Eliminar", "Salir del grupo").
- **Insignias de estado:** pastilla chica con ícono de línea, nombre y color del estado (Pendiente, Confirmada, Denegada, Cancelada).
- **Votos:** como encuesta, con "Sí" y "No", el conteo a la derecha y el voto propio marcado.
- **Renglón de actividad:** hora en negrita a la izquierda, título, votos y estado; al tocarlo se abre la tarjeta completa debajo. Las alternativas van debajo de su original, con sangría y una "o" delante.
- **Íconos:** de línea, de un solo color (toman el color del texto), trazo 2 px en grilla de 24. Son decorativos; el significado siempre lo lleva el texto.
- **Avisos:** caja con borde izquierdo de 4 px del color del tipo (información, éxito, error) y un ícono; los diálogos llevan título, el texto mínimo y "Cancelar" a la izquierda de la acción.
- **Persona:** círculo con la inicial del nombre (no hay fotos todavía).

## Do's and Don'ts

- Do: una sola acción principal (mostaza) por pantalla.
- Do: separar tarjetas con borde, no con sombra.
- Do: usar datos reales de un viaje (Bariloche, nombres, montos en pesos, fechas de diciembre) en vez de texto de relleno.
- Do: textos cortos en español rioplatense con voseo; avisos de una línea cuando alcanza.
- Do: acompañar cada color de estado con un ícono y su nombre.
- Do: mantener los mismos componentes, colores y radios en todas las pantallas.
- Don't: degradés (y menos violeta a azul), texto con degradé, efecto vidrio o desenfoque de fondo.
- Don't: título centrado gigante con tres tarjetas de beneficios debajo; esto es una herramienta, no una página de venta.
- Don't: íconos dentro de cuadraditos o círculos de color, destellos ✨ para "inteligente", emojis como íconos.
- Don't: sombras en tarjetas en reposo, ni bordes redondeados distintos a los definidos.
- Don't: colores nuevos fuera de esta paleta, ni la mostaza en montos o estados.
- Don't: animaciones de entrada en cada sección, rebotes ni contadores que suben solos; respetar "reducir movimiento".
- Don't: etiquetas en mayúsculas espaciadas, numeraciones decorativas 01 / 02 / 03 ni frases como "Viví la experiencia" o "Llevá tu viaje al siguiente nivel".
