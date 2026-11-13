# Inventario y Préstamos

App independiente sacada de RECOIN (solo las partes de Inventario y Préstamos).
HTML + JS puro + Supabase, igual que el proyecto original. Sin build: se sube tal cual a Vercel.

## Puesta en marcha

1. **Supabase**: crea un proyecto (o usa uno vacío). En *SQL Editor* ejecuta
   `supabase_inventario_prestamos.sql` **una sola vez**.
2. En *Authentication > Users* crea las cuentas (encargado y, si quieres, director) y
   asigna el rol con el SQL que está al final del archivo `.sql`.
3. En `js/services/01-config.js` pon tu `SUPA_URL` y tu clave pública (`SUPA_KEY`).
4. Datos de la institución (encabezado de Excel/PDF, prefijo `JEC-`, categorías):
   `js/core/app-config.js`.
5. Sube la carpeta a Vercel (framework: *Other*, sin comando de build).

## Roles

| Rol | Puede |
|---|---|
| `admin` (encargado) | Agregar/editar/dar de baja bienes, registrar y devolver préstamos, gestionar docentes |
| `directivo` | Solo consultar y exportar |
| sin perfil | No entra (ve un aviso) |

La restricción real está en las políticas RLS del SQL, no solo en la pantalla.

## Qué cambió respecto a RECOIN

- Quitado: copias, solicitudes, cobros, boletas, reportes, usuarios por Edge Function y cambio de contraseña temporal.
- Nuevo: tabla `docentes` y pestaña **Docentes** (agregar pegando una lista o importando un Excel con columna `nombre` y opcional `activo`; hay botón de plantilla; activar/desactivar, editar). Antes los docentes venían del módulo de copias.
- Nuevo: tabla `perfiles` incluida en el SQL (antes se asumía que ya existía).
- Las cuentas se crean desde el panel de Supabase (ya no hay pantalla de usuarios).
- Los íconos (`icon-192.png`, `icon-512.png`) son los de RECOIN: reemplázalos si quieres otro logo.
