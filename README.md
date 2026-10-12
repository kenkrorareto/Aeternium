# Aeternium

Atlas y galería del mundo de Aeternium en una sola aplicación dinámica.

- **Mapa** (`/mapa`): visor Leaflet (`CRS.Simple`) con selector de mapas, marcadores
  y rutas. El admin puede crear marcadores con **clic derecho**, arrastrarlos para
  moverlos y editarlos o borrarlos.
- **Galería** (`/galeria`): grid de personajes con búsqueda, orden y filtros por inicial.
- **Admin** (`/admin`): protegido por contraseña. Sube personajes (Galería) y mapas
  nuevos (Rol) y borra contenido.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend/SSR | Next.js 15 (App Router) + React 19, desplegado en Vercel |
| Datos | Supabase Postgres (`characters`, `maps`, `markers`, `lines`) |
| Imágenes | Supabase Storage (buckets `characters` y `maps`, lectura pública) |
| Auth | Contraseña de admin única + cookie de sesión firmada (`jose`) |

Los sitios estáticos originales (`Aeternium_Map`, `Aeternium_Gallery`) se conservan
como fuente y respaldo: su contenido se migra con `npm run seed`.

## Requisitos

- Node 20+
- Un proyecto de Supabase y una cuenta de Vercel.

## Puesta en marcha local

1. **Variables de entorno**

   ```bash
   cp .env.example .env.local
   ```

   Rellena `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` y `AUTH_SECRET`.

2. **Preparar Supabase**

   En el *SQL Editor* del proyecto, ejecuta `supabase/migrations/0001_init.sql`.
   Esto crea las tablas con lectura pública, las políticas RLS y los buckets de
   Storage `characters` y `maps` (lectura pública).

3. **Migrar el contenido actual**

   ```bash
   npm install
   npm run seed
   ```

   Sube los 11 personajes, los mapas Aeternium/Caenanis y sus marcadores. Es
   idempotente: se puede repetir sin duplicar.

4. **Desarrollo**

   ```bash
   npm run dev          # http://localhost:3000
   ```

## Despliegue en Vercel

1. Importa el repositorio `Aeternium` en Vercel.
2. Añade las 5 variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`,
   `AUTH_SECRET`).
3. Deploy. No requiere disco persistente: todo el estado vive en Supabase.

## Endpoints

Lecturas públicas:

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/characters` | Lista de personajes (con URL de imagen) |
| GET | `/api/maps` | Lista de mapas |
| GET | `/api/maps/[slug]` | Mapa + marcadores + líneas |

Mutaciones (requieren sesión de admin):

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` · `/api/auth/logout` | Iniciar/cerrar sesión |
| GET | `/api/auth/session` | Estado de la sesión |
| POST | `/api/admin/characters` | Subir personaje (multipart) |
| DELETE | `/api/admin/characters/[id]` | Borrar personaje y su imagen |
| POST | `/api/admin/maps` | Subir mapa (multipart, detecta dimensiones) |
| PATCH/DELETE | `/api/admin/maps/[id]` | Renombrar / borrar mapa |
| POST | `/api/admin/maps/[id]/markers` | Crear marcador |
| PATCH/DELETE | `/api/admin/markers/[id]` | Mover/editar / borrar marcador |
| POST | `/api/admin/maps/[id]/lines` | Crear ruta |

## Estructura

```
app/                 rutas (páginas + API)
components/          MapView, Gallery, AdminPanel, LoginForm, SiteNav
lib/                 tipos, cliente Supabase, auth, sesión, helpers
supabase/migrations/ esquema inicial
scripts/seed.ts      migración del contenido estático
.hub/project.yaml    manifiesto para desarrollo local con WebOps Hub
```

## Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` se usa **solo en el servidor** (route handlers y seed);
  nunca llega al navegador.
- Las tablas tienen RLS: lectura pública, escritura únicamente vía API con service role.
- Las rutas `/admin` y `/api/admin/*` están protegidas por el middleware mediante
  cookie `HttpOnly` firmada.
