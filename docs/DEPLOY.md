# Despliegue de Aeternium (Vercel + Supabase)

Guía paso a paso para pasar de local a producción. Orden recomendado: primero
Supabase, después el seed y por último Vercel.

---

## 1. Proyecto de Supabase

Elige una de las dos opciones:

- **Reutilizar un proyecto existente** (p. ej. el que ya usas en otros sitios):
  las tablas de Aeternium conviven con las demás. Válido porque el esquema usa
  nombres propios (`characters`, `maps`, `markers`, `lines`) y buckets
  `characters`/`maps`.
- **Crear un proyecto nuevo** en <https://supabase.com/dashboard> (recomendado
  para aislar el contenido).

De **Project Settings → API** necesitas:

| Dato | Variable |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key (¡secreta!) | `SUPABASE_SERVICE_ROLE_KEY` |

## 2. Crear el esquema

Abre el **SQL Editor** del proyecto y ejecuta el contenido de
`supabase/migrations/0001_init.sql`. Crea:

- Tablas `characters`, `maps`, `markers`, `lines` con RLS de lectura pública.
- Buckets de Storage `characters` y `maps` (lectura pública).

> Si prefieres la CLI de Supabase:
> `supabase link --project-ref <ref>` y `supabase db push`
> (no está instalada en esta máquina; con el SQL Editor es suficiente).

## 3. Configurar variables locales

```bash
cp .env.example .env.local
```

Rellena los 5 valores. Para generar secretos:

```bash
openssl rand -hex 32     # AUTH_SECRET
```

`ADMIN_PASSWORD` es la contraseña del panel `/admin` (elígela tú).

## 4. Verificar y migrar el contenido

```bash
npm run verify     # comprueba variables, tablas y buckets
npm run seed       # sube personajes, mapas y marcadores existentes
```

El seed es idempotente: si lo repites no duplica nada.

## 5. Desplegar en Vercel

Con la CLI (ya autenticada en esta máquina) o desde el panel web.

### Con la CLI

```bash
cd webops/rol/Aeternium

vercel link            # crea/vincula el proyecto "aeternium"
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ADMIN_PASSWORD production
vercel env add AUTH_SECRET production

vercel --prod
```

Repite `vercel env add` para el entorno `preview` si quieres ramas de preview.

### Desde el panel de Vercel

1. **Add New → Project** → importa el repositorio `Aeternium`.
2. Framework: **Next.js** (detección automática). Sin comandos personalizados.
3. En **Environment Variables** añade las 5 variables (las mismas de `.env.local`).
4. **Deploy**.

No se necesita disco persistente ni base de datos gestionada por Vercel: todo el
estado vive en Supabase.

## 6. Comprobaciones tras el deploy

- `https://<proyecto>.vercel.app/mapa` → se ve el mapa con sus marcadores.
- `https://<proyecto>.vercel.app/galeria` → personajes con búsqueda.
- `https://<proyecto>.vercel.app/admin` → pide contraseña y, tras entrar,
  permite subir personajes/mapas y editar marcadores con clic derecho.

## Notas

- **Nunca** expongas `SUPABASE_SERVICE_ROLE_KEY` con prefijo `NEXT_PUBLIC_`: solo
  se usa en el servidor.
- Si las imágenes no cargan, revisa que los buckets sean **públicos**.
- Para cambiar la contraseña de admin, actualiza `ADMIN_PASSWORD` en Vercel y
  redeploya.
