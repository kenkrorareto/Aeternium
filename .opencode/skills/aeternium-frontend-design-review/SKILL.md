---
name: aeternium-frontend-design-review
description: |
  Revisión completa de diseño frontend para Aeternium (Next.js 15 App Router, CSS vanilla, Leaflet, Supabase). Combina la auditoría de reglas web-design-guidelines (100+ reglas), el diagnóstico de redesign-existing-projects filtrado por el design system de Aeternium y una verificación visual con playwright-cli (screenshots 320/768/1440 antes/después). Auditoría visual, responsive (mobile-first), accesibilidad (WCAG 2.2), consistencia del design system y hallazgos accionables.

  Úsalo cuando el usuario pida: "revisión de diseño", "design review", "UI audit", "auditoría frontend", "revisar componentes", "mejorar UI/UX", "mejorar estilos", "revisar el mapa/galería/admin" o "analizar responsive".
---

# Aeternium Frontend Design Review

Especialista en revisión de diseño para **Aeternium** (atlas + galería). Analiza con criterio pragmático (mapa Leaflet pesado, galería de retratos, panel admin sencillo) y mantiene coherencia con el design system existente.

## 0. Flujo de trabajo (skills colaboradoras)

1. **Cargar skills** con la tool `skill`:
   - `web-design-guidelines` — auditoría regla a regla; usa su copia local `references/guidelines.md` (sin red) y su formato de salida `file:line`.
   - `redesign-existing-projects` — diagnóstico de patrones genéricos y mejoras premium (scan → diagnose → fix).
2. **Fase visual** con `playwright-cli` (fuentes y referencias locales: `playwright-cli` SKILL + `references/`).
3. **Filtrar el diagnóstico** con el contexto de Aeternium (§1–§2).
4. **Aplicar fixes** respetando CSS vanilla y convenciones del repo; verificar con `npm run lint` y `npx tsc --noEmit`.

## 1. Alcance y principios
- **Mobile-first**. Empezar por 320px, escalar hacia arriba (md+ 900px, xl+ 1440px).
- **Spanish UI** por defecto.
- **CSS vanilla** en `app/globals.css` con tokens en `:root`. No introducir Tailwind ni librerías de componentes. No añadir dependencias de UI.
- **Design system existente**: fuentes **Cinzel** (display), **EB Garamond** (texto), **MedievalSharp** (títulos de galería) vía `next/font/google`. Paleta: ciruela `#430152/#2c0136`, naranja quemado `#973e03/#c9760f`, dorado `#f0c674/#f6dd99`, pergamino `#f5e6c8`. Acento único: dorado.
- **Iconos**: SVG inline (Leaflet/HTML). No cambiar a librerías de iconos.
- **Mapa**: Leaflet con `CRS.Simple` e `imageOverlay`. No sustituir librería.
- **Mimetizar código existente**. Seguir convenciones, no añadir comentarios innecesarios.
- **Accesibilidad primero**: semántica HTML antes que ARIA, foco visible, contraste suficiente.
- **Cambios mínimos y accionables**. Proponer parches con `file_path:line_number`.

### Filtro de sugerencias externas (obligatorio)
Las skills `redesign-existing-projects` y `web-design-guidelines` traen reglas genéricas. Antes de aplicarlas, descarta las que choquen con Aeternium:

- **Tipografía**: usar las 3 fuentes existentes (Cinzel/EB Garamond/MedievalSharp). No proponer cambiar de fuente ni añadir otras. Sí se aceptan tamaños/line-height/tracking corregidos y `text-wrap: balance` en títulos.
- **Paleta**: mantener ciruela/naranja/dorado sobre fondo oscuro. No proponer paletas alternativas ni acentos nuevos. Se aceptan correcciones de contraste, sombras tintadas y textura sutil dentro de la paleta.
- **Tema**: la app es **solo dark** por diseño (fantasía). No proponer modo claro ni toggle.
- **Componentes**: no migrar de CSS vanilla ni de Leaflet. Mejoras = clases CSS nuevas respetando la nomenclatura BEM-lite existente (`.site-nav__tab`, `.thumbnail-container`, etc.).
- **Copy en español**: adaptar reglas anglosajonas a español (sentence case, voz activa, sin exclamaciones).
- **Admin** (`/admin`, `AdminPanel`): prioriza densidad, claridad y seguridad de datos sobre estética.
- Las sugerencias descartadas se anotan como `N/A (design system)` en el informe, sin ignorarlas en silencio.

## 2. Design tokens
Extraer/validar de `app/globals.css`:
- **Colores**: `--plum-deep`, `--plum-deeper`, `--burnt-orange`, `--ember`, `--gold`, `--gold-bright`, `--gold-deep`, `--gold-soft`, `--parchment`, `--panel`, `--panel-bg`, `--panel-border`. Fondo gradiente (radial + 135deg ciruela→naranja) fijo.
- **Fuentes**: `--font-cinzel`, `--font-eb-garamond`, `--font-medieval`.
- **Radio**: pastillas 999px, tarjetas 0.8–1em, inputs 0.5rem.
- **Espaciado**: rem/em consistentes.
- **Sombras**: negras al 45–70%; aceptable, mejorable con tinte dorado/ciruela.

## 3. Revisión obligatoria
Verificar layout shell (nav sticky, main, footer, skip-link), mapa (selectores, overlay admin, tooltips, controles leaflet), galería (grid, busca, filtros letra, skeleton, empty state), login (form), admin (forms de subida, listas, noticias), responsive 320/768/1440, a11y (focos, aria, alt) y prefers-reduced-motion.

## 4. Salida
- Por severidad: `Critical` / `High` / `Medium` / `Low` / `Nitpick`
- Ubicación: `file_path:line_number`
- Problema + Impacto + Fix concreto (old→new)
- Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build`

## 5. Fase visual con playwright-cli
Requisitos: `playwright-cli` instalado y el servidor local levantado (`npm run dev -- -p 8090` → `http://localhost:8090`).

1. **Capturas antes**: para cada página relevante (`/mapa`, `/galeria`, `/admin/login`, `/admin`) en viewports:
   - `playwright-cli resize 320 800` → screenshot
   - `playwright-cli resize 768 1024` → screenshot
   - `playwright-cli resize 1440 900` → screenshot
   - `/admin` requiere login previo con la contraseña admin (`state-save`/`state-load` según `references/storage-state.md`).
2. **Inspección**: `snapshot` (árbol de accesibilidad con refs) + `console` para detectar errores; contraste y overflow con `eval` si hace falta.
3. **Aplicar fixes** por severidad (§4).
4. **Capturas después**: repetir los mismos viewports y comparar antes/después en el informe.
5. `playwright-cli close` al terminar.

Las capturas se guardan donde las ponga el CLI (`.playwright-cli/`, ignorado por git). No subir capturas al repo.

## 6. Salida del informe
Además de §4, incluir:
- Resumen de reglas incumplidas agrupadas por categoría (de `web-design-guidelines`).
- Diagnóstico de rediseño: hallazgos aplicables + `N/A (design system)` filtrados.
- Tabla antes/después con las rutas locales de las capturas de §5.