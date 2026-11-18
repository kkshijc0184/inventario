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

## Etiquetas (stickers)

Inventario > **Etiquetas**: marca los bienes y pulsa *Generar etiquetas*. Se abre una vista previa con hojas A4
de stickers circulares (escudo, nombre de la I.E. en arco, código y serie) con las medidas del modelo de 60 mm
(12 por hoja). Desde ahí: *Imprimir / Guardar como PDF* (tamaño A4, márgenes «Ninguno», escala 100 %).

- Los equipos prioritarios (laptops, proyectores, computadoras, tablets, monitores/TV, impresoras, audio y cámaras)
  salen primero. Las palabras que los detectan están en `ETQ_GRUPOS` (`js/modules/04-etiquetas.js`).
- Tamaños: 60, 45 o 35 mm. Opciones: incluir serie, contorno de corte magenta y una etiqueta por unidad en lotes.
- Por defecto solo se etiquetan los bienes en estado **Bueno** (filtro «Estado»: también puede incluir regulares o todos). Los bienes dados de baja nunca se etiquetan. Lo pueden usar el administrador y el directivo.
