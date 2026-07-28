---
version: alpha
name: Cancha
description: "Un diseño deportivo, limpio y directo para una liga de futsal amateur. Inspirado en la cancha, los colores del juego y la seriedad de una liga que se toma el deporte en serio sin perder la calidez del club de barrio."
colors:
  primary: "#1a6b3c"
  on-primary: "#ffffff"
  primary-light: "#e8f5e9"
  surface: "#ffffff"
  foreground: "#1a1a2e"
  muted: "#6b7280"
  muted-bg: "#f3f4f6"
  border: "#e5e7eb"
  accent: "#f59e0b"
  accent-soft: "#fef3c7"
  destructive: "#dc2626"
  destructive-soft: "#fef2f2"
  success: "#16a34a"
  success-soft: "#f0fdf4"
typography:
  display:
    fontFamily: "'Inter Variable', system-ui, -apple-system, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  heading:
    fontFamily: "'Inter Variable', system-ui, -apple-system, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
spacing:
  base: 4px
  scale: [4, 8, 16, 24, 32, 48, 64, 96]
radius:
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px
motion:
  duration-fast: 150ms
  duration-base: 200ms
  duration-slow: 300ms
  easing: "ease-out"
shadows:
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
  md: "0 4px 6px -1px rgb(0 0 0 / 0.08)"
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.08)"
---

## Rationale

Cancha es un sistema de diseño para una liga de futsal amateur. El nombre evoca la cancha de juego: el rectángulo verde, las líneas blancas, la red. Todo es funcional, nada es decorativo por serlo.

El verde primary (#1a6b3c) no es un verde genérico "naturaleza" — es el verde de una cancha de futsal bien mantenida. El blanco de las líneas de la cancha es el surface blanco. El amarillo ámbar (#f59e0b) es el color del árbitro, del balón clásico, del "pitazo" que arranca el partido.

No hay glassmorphism, no hay gradientes abstractos, no hay tipografía decorativa. Esto es una página de liga: se ve la tabla de posiciones, los resultados, los equipos. Lo que importa es el contenido, no el contenedor.

## 1. Visual Theme & Atmosphere

Limpio, deportivo, institucional. El sitio de una liga seria pero de barrio: da confianza, se ve legítimo, no parece un template de startup. 

El fondo es blanco (no crema). Las cards tienen sombras sutiles y borders suaves. El verde aparece en headers, botones principales, y acentos — nunca abusa de él. Los equipos tienen sus escudos como protagonistas visuales.

## 2. Color System

**Primary:** Verde cancha (#1a6b3c) — el color principal. Botones, headers, links, acentos fuertes.
**Primary Light:** Verde muy claro (#e8f5e9) — fondos de secciones destacadas, badges.
**Surface:** Blanco (#ffffff) — fondo principal, cards.
**Foreground:** Casi negro azulado (#1a1a2e) — texto principal. Más suave que el negro puro.
**Muted:** Gris (#6b7280) — texto secundario, metadata.
**Muted-bg:** Gris claro (#f3f4f6) — fondos alternados.
**Border:** Gris suave (#e5e7eb) — borders de cards, inputs, tablas.
**Accent:** Amarillo ámbar (#f59e0b) — badges de "próximamente", highlights, warnings.
**Destructive:** Rojo (#dc2626) — errores, tarjetas rojas, sanciones.
**Success:** Verde éxito (#16a34a) — confirmaciones, "finalizado".

## 3. Typography

**Display (36px, 700, -0.02em):** Títulos de página, hero. Usa Inter Variable (Google Font) para un look deportivo moderno pero serio. Tight tracking para impacto.

**Heading (22px, 600, -0.01em):** Títulos de sección. Inter. Suficiente peso para jerarquía sin gritar.

**Body (15px, 400):** Texto de lectura. system-ui para velocidad. Inter cae bien como fallback visual.

**Small (13px):** Metadatos, fechas, scores secundarios. Claro y legible.

**Mono (13px):** Código o datos técnicos si aparecen.

## 4. Components & Patterns

- **Botones primarios:** Verde cancha, white text, hover ligeramente más oscuro.
- **Botones outline:** Border verde, text verde, sin relleno.
- **Cards:** White surface, border sutil, shadow sm en reposo y md en hover. Border radius md (8px).
- **Tablas:** Clean, header con muted-bg, rows con border-bottom, hover sutil. Sin stripes.
- **Badges:** Small, radius full, variants: default (muted-bg), success (green), warning (amber), destructive (red).
- **Inputs/Forms:** Border sutil, focus ring verde, radius md.
- **Navigation:** Links con hover underline o active indicator. Header con sombra sutil.
- **Tabla de posiciones:** Highlight top 3 con badge, row del equipo actual con primary-light bg.

## 5. Spacing & Layout

Sistema de 4px base:
- **4px:** gaps mínimos entre elementos relacionados
- **8px:** padding interno de elementos pequeños
- **16px:** padding de cards, gap entre elementos
- **24px:** padding de secciones, gap entre cards
- **32px:** espaciado entre secciones grandes
- **48-64px:** espaciado de hero, secciones principales
- **96px:** espaciado de secciones muy separadas

Layout: container centrado con max-width de 1200px. Padding lateral de 16px en mobile, 24px en desktop.

## 6. Motion & Interaction

Transiciones rápidas y decididas:
- **150ms:** hover states, color transitions
- **200ms:** default interactions, card hover
- **300ms:** modals, sheets, page transitions
- **Easing:** ease-out para entrada natural

Sin movimiento decorativo. Todo motion sirve a la interacción: hover que confirma que es clickeable, card que se eleva al pasar el mouse, sheet que desliza con propósito.

## 7. Accessibility

- Contrast ratio mínimo 4.5:1 para texto normal, 3:1 para texto grande
- Focus visible en todos los interactive elements (ring verde de 2px)
- Targets táctiles mínimos de 44x44px
- Soportar prefers-reduced-motion
- No usar color como único indicador de estado

## 8. Anti-Patterns (AI Slop a evitar)

- ❌ Fondos crema/beige
- ❌ Tipografía serif itálica para displays
- ❌ Glassmorphism / blur effects sin propósito
- ❌ Cards dentro de cards
- ❌ Side-tabs, chip con borde lateral
- ❌ Gradientes abstractos
- ❌ Iconos genéricos que no aportan información
- ❌ Sombras exageradas
- ❌ Números de sección (01, 02, 03) decorativos
- ❌ "Modern teams", "Operating system", "Everything in one place" y otras frases de template startup
- ❌ Puntos pulsantes o indicadores de "cargando" falsos
