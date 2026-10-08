# Sesión del personal con datos de prueba — Issue #4

Rama `feat/issue-4-sesion-personal`, preparada desde `develop` (`ec60ec4`). Los cambios locales de la carpeta original se conservan separados de esta rama.

## Fuentes y alcance

- [Issue #4](https://github.com/villaserenaguatee/villa-serena-web/issues/4).
- [OBJ-0E](https://github.com/villaserenaguatee/villa-serena-docs/blob/main/15%20-%20Prompts%20de%20IA/OBJ-0E%20-%20Web%20-%20Proyecto%20base%20y%20BFF.md), [Plan, sección 5](https://github.com/villaserenaguatee/villa-serena-docs/blob/main/13%20-%20Plan%20de%20Trabajo.md) y [Avance](https://github.com/villaserenaguatee/villa-serena-docs/blob/main/17%20-%20Avance%20del%20Proyecto.md).
- Instrucciones AGENTS de los prompts, arquitectura §6.1, roles R-ROL-08, matriz de permisos y HU-EMP-01/02.
- `openapi.yaml` y `src/lib/api/schema.d.ts` existentes en `develop`. La copia coincide con `villa-serena-api/develop` (blob `45da8635278b5bcda47e2295e432b0b33d56598b`). El contrato se conserva sin cambios.

La indicación vigente de Alex y del usuario es comprobar primero el flujo **con datos de prueba detrás del BFF**. La conexión con Spring se validará después. No se implementan pantallas de negocio de otros objetivos.

## Cómo probar

Desde esta carpeta de trabajo:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Abrir `http://localhost:3000` y `/panel/login`. `STAFF_AUTH_MODE=demo` es el valor predeterminado; no necesita Spring. Todas las cuentas siguientes usan inicialmente `VillaSerena26`:

| Correo | Rol / área | Caso |
| --- | --- | --- |
| admin@villaserena.gt | ADMIN | Acceso habitual |
| recepcion@villaserena.gt | RECEPCION | Acceso habitual |
| roomservice@villaserena.gt | ROOM_SERVICE | Acceso habitual |
| limpieza@villaserena.gt | MANTENIMIENTO_LIMPIEZA / LIMPIEZA | Acceso habitual |
| mantenimiento@villaserena.gt | MANTENIMIENTO_LIMPIEZA / MANTENIMIENTO | Acceso habitual |
| ambas@villaserena.gt | MANTENIMIENTO_LIMPIEZA / AMBAS | Ambas áreas |
| temporal@villaserena.gt | RECEPCION | Cambio obligatorio |
| inactivo@villaserena.gt | RECEPCION | Acceso rechazado |

Se reutilizan también los empleados iniciales de `src/data/pms.ts`, con su rol, área y estado. Cambiar el personal en localStorage no cambia las cuentas del BFF.

El proveedor demo conserva el estado en memoria del servidor: reiniciar Next.js restablece contraseñas, bloqueos y sesiones. Guarda contraseñas con scrypt y tokens opacos como hashes; estos tokens de prueba simulan la sesión y **no son JWT emitidos por Spring**.

```powershell
pnpm check
pnpm test:bff
pnpm build
# Con pnpm dev abierto y el estado demo recién reiniciado:
pnpm test:staff:browser
```

La prueba del navegador cambia la contraseña temporal a `NuevaClave123`. Reiniciar el servidor antes de repetirla. `STAFF_TEST_URL` permite usar otro puerto.

## Comportamiento del BFF

| Ruta del navegador | Contrato del proveedor |
| --- | --- |
| POST /api/auth/login | POST /api/v1/auth/login |
| GET /api/auth/yo | GET /api/v1/auth/yo |
| POST /api/auth/cambiar-contrasena | POST /api/v1/auth/cambiar-contrasena |
| POST /api/auth/logout | POST /api/v1/auth/cerrar-sesion |
| Renovación interna ante 401 | POST /api/v1/auth/renovar |

Login y cambio de contraseña devuelven exclusivamente `EmpleadoSesion`, con `id`, `nombre`, `correo`, `rol`, `area` y `debeCambiarContrasena`; `/yo` devuelve lo mismo. Los campos de entrada y los errores (`codigo`, `mensaje`, `detalles`) siguen el contrato. Logout responde 204.

Las cookies `vs_staff_access` y `vs_staff_refresh` son HttpOnly, SameSite=Lax y path `/`, con Secure fuera de localhost. El acceso dura 15 minutos y el refresh 7 días. No se devuelve ningún token en JSON ni se guarda la sesión del personal en localStorage. El portal demo del huésped conserva su acceso existente, fuera del alcance de este Issue.

Ante un 401 se renueva una sola vez y se repite la operación. El refresh anterior queda inválido. Si falla la renovación se borran ambas cookies y se pide login. Para renovar durante el render del servidor, `/api/auth/continuar` escribe las cookies y vuelve únicamente a una ruta local del personal.

Middleware y controles del servidor protegen `/panel` y las rutas existentes `/admin`, `/recepcion`, `/room-service`, `/limpieza` y `/mantenimiento`. El rol y el área se confirman con `/yo`, nunca con localStorage. La contraseña temporal impide abrir otras páginas y operar por el proxy. El panel muestra el menú del rol; los módulos actuales conservan su diseño. Cambiar contraseña también está disponible desde la cuenta del personal.

POST, PUT, PATCH y DELETE bajo `/api` requieren un Origin idéntico al del BFF; uno distinto o ausente recibe 403. El proxy genérico excluye webhook de Stripe, API del canal, acceso móvil y rutas de auth; el navegador nunca puede renovar usando un token enviado en JSON. En modo demo, operaciones de negocio no cubiertas por este Issue devuelven 501; se mantienen los BFF públicos existentes.

## Conexión real y pendiente

Evidencia local del 6 de octubre de 2026:

- `pnpm check`: TypeScript e idiomas correctos (60 claves por idioma).
- Suite `test:bff`: **49 pruebas correctas**, incluidas 9 de sesión; se conservaron las pruebas de disponibilidad, reserva y Recepción.
- `pnpm build`: compilación completa correcta; rutas privadas y handlers de sesión dinámicos.
- `test:staff:browser` con `pnpm dev` en `http://localhost:3000`: inicio público, redirección sin sesión, menú de Recepción, cookies HttpOnly e invisibles para JavaScript, ausencia de tokens en JSON y de sesión del personal en localStorage, recarga, acceso denegado por rol, renovación y rotación al abrir el panel, logout, Origin, bloqueo temporal, cambio de contraseña y menús de todos los roles/áreas. Sin errores de página.
- El navegador necesitó permiso de red para las fuentes e imágenes externas del diseño existente; el entorno restringido producía errores al cargar Google Fonts. No se cambiaron esos recursos.
- `git diff --check`: correcto. El contrato, el archivo de dependencias fijadas y los módulos de negocio se conservaron.

El adaptador separado `spring.ts` usa `STAFF_AUTH_MODE=spring` y `API_URL` (solo servidor). No hace fallback a datos demo si Spring falla. Está comprobado con un transporte falso que verifica rutas y cuerpos; **eso no es una prueba con la API de Pablo**.

**Pendiente:** iniciar la API de Pablo con usuarios de prueba y validar login, contraseña temporal, roles/áreas, cookies, expiración y rotación reales, revocación, logout y errores. El criterio 2 del Issue con la API real permanece pendiente. Tampoco se consideran integrados los servicios de negocio de otros Issues.

El usuario autorizó el commit, la subida de esta rama y el PR hacia `develop`, relacionado con #4 e indicando que funciona con datos de prueba. No se autoriza merge ni cierre del Issue.
