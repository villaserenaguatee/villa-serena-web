# Villa Serena PMS

Sistema web para la operación de Villa Serena. El proyecto está construido con Next.js, React, TypeScript y Tailwind CSS.

## Requisitos

- Node.js 20 o superior.
- pnpm.

Para las suites de pruebas y CI: Node 24.16.0 y pnpm 12.0.0.
Consultar [pruebas y migración de #48](docs/TESTING_ISSUE48.md) para instalación
de Chromium, comandos `test:unit`, `test:component`, `test:e2e` y `test:ci`,
reportes y alcance del modo demo.

## Instalación

```powershell
pnpm install
pnpm dev
```

Abrir `http://localhost:3000`.

Para validar TypeScript e internacionalización:

```powershell
pnpm check
```

Para generar la compilación de producción:

```powershell
pnpm build
pnpm start
```

## Variables de entorno

Copiar `.env.example` a `.env.local` cuando se configure traducción automática.

```env
DEEPL_API_KEY=
DEEPL_API_URL=https://api-free.deepl.com/v2/translate
```

`DEEPL_API_KEY` es opcional. Si no existe, las funciones que requieren traducción automática informan que el servicio no está configurado.

## Accesos

El personal entra desde `/panel/login`. Estas cuentas usan datos de prueba del BFF:

| Área | Correo | Contraseña para uso local |
| --- | --- | --- |
| Administración | `admin@villaserena.gt` | `VillaSerena26` |
| Recepción | `recepcion@villaserena.gt` | `VillaSerena26` |
| Limpieza | `limpieza@villaserena.gt` | `VillaSerena26` |
| Room Service | `roomservice@villaserena.gt` | `VillaSerena26` |
| Mantenimiento | `mantenimiento@villaserena.gt` | `VillaSerena26` |
| Portal del huésped | `anamorales@gmail.com` | `demo123` |

El huésped entra desde `/login` con `anamorales@gmail.com` y `demo123`. Su acceso no cambia. La contraseña del personal corresponde al modo de prueba; no configura las credenciales de Spring.

## Estructura principal

```text
src/
├── app/                    Rutas públicas y privadas de Next.js
├── components/             Componentes compartidos
├── data/                   Datos públicos reutilizables
├── features/               Módulos funcionales por área
│   ├── admin/
│   ├── huesped/
│   ├── limpieza/
│   ├── mantenimiento/
│   ├── recepcion/
│   └── roomservice/
├── store/                  Estado, eventos y sincronización compartida
├── data/                   Catálogos y datos iniciales
├── hooks/                  Hooks globales
├── i18n/                   Traducciones de interfaz
└── lib/                    Tipos, autenticación, API, reservas y traducción
```

## Módulos

### Web pública

Permite consultar habitaciones, revisar disponibilidad y completar el flujo de reserva. La reserva pública se sincroniza con Recepción mediante los almacenes compartidos del PMS.

### Recepción

Gestiona vista del día, reservas, disponibilidad, habitaciones, huéspedes, solicitudes, incidencias, reportes, objetos olvidados y chat. Se conecta con Limpieza al realizar check-out, con Mantenimiento al reportar incidencias y con el Portal del huésped para mantener reservas y actividad sincronizadas.

Las reservas nuevas del calendario se crean mediante el BFF (`POST /api/huespedes` y
`POST /api/reservas`). Disponibilidad, calendario, búsqueda y detalle consultan las
rutas de Recepción del contrato. En modo de prueba quedan en
`.data/reception-demo.json` (o `VILLA_SERENA_RECEPTION_DEMO_PATH`), con cuenta abierta
y sin pagos. No se envía correo ni se conecta Spring.

Se conservan las reservas locales anteriores y la copia necesaria para cuenta y
check-in. El calendario evita repetir las ocho reservas iniciales que ya representa
el BFF; no borra sus registros. Las reservas antiguas que solo existen en el
navegador siguen siendo locales: el contrato no contempla importarlas con su código
anterior y no se recrean automáticamente. Si se pierde una respuesta de creación,
se pide consultar la búsqueda antes de crear otra reserva.

Pruebas de calendario, creación con/sin habitación, búsqueda, detalle, cancelación,
habitaciones y check-in en computadora y móvil: `pnpm test:reception:browser`.
Playwright inicia y detiene Next/Chromium, usa fechas relativas al día del hotel
y restaura datos demo aislados antes de cada caso. No requiere iniciar `pnpm dev`.
Los detalles de equivalencia y las limitaciones están en
[la migración de #48](docs/TESTING_ISSUE48.md).

Reserva pública y portal por código: `pnpm test:booking:browser`. Presentación,
estados y recuperación del pago: `pnpm test:payments:browser`. Ejecutar en
secuencia; cada bloque inicia su servidor y usa archivos demo temporales.
Canales y acceso del personal/huésped: `pnpm test:channels:browser`.
Este bloque y el nuevo caso de sondeo de pagos están implementados, pendientes
de validación en CI; por decisión de trabajo, no se ejecutan navegadores locales
durante esta etapa. `pnpm check` permite comprobar TypeScript e i18n sin Next.
Cuenta demo, check-out y factura: `pnpm test:cuenta:browser` (12 casos,
computadora/móvil, PDF ticket/carta). También está pendiente de validación en CI;
no cubre la cuenta conectada a Spring.
Cuenta conectada con transporte HTTP falso: `pnpm test:cuenta:connected`, también
incluido en `pnpm test:integration:mock`. El fixture inicia API falso y Next,
restaura datos por caso y comprueba el BFF real, sin acreditar Spring real.
Sus 12 casos están implementados, pendientes de Playwright/CI.
Guard conectado de Recepción: `pnpm test:reception:api` (6 casos pendientes de CI).
Usa autenticación demo y bloquea operaciones BFF no conectadas con 503, conservando
las reservas locales que anuncia el calendario; no prueba Spring real.
Operaciones con API y frames STOMP falsos: `pnpm test:operaciones:browser`
(6 casos pendientes de CI). Room Service, habitaciones/reportes y Mantenimiento
usan servidores nuevos y reportes separados; CI ejecuta cada bloque en su VM.

### Portal del huésped

Permite consultar la estancia, realizar check-in web, reservar otra estancia, solicitar servicios, consultar cuenta, utilizar el chat y reservar experiencias. Comparte reservas, habitaciones, menú, pedidos, cargos y mensajes con los módulos internos correspondientes.

### Room Service

Gestiona pedidos, estado de preparación, menú, historial y cargos. Los pedidos enviados desde el Portal del huésped se leen mediante la sincronización de Room Service y los cambios de estado regresan al portal.

### Limpieza

Gestiona habitaciones asignadas, mapa, solicitudes, incidencias, objetos olvidados e historial. Recibe tareas generadas por la salida de huéspedes y puede reportar incidencias a Mantenimiento.

### Mantenimiento

Gestiona incidencias, órdenes de trabajo, preventivo y activos. Los estados de las habitaciones se comparten con Recepción y Administración.

### Administración

Gestiona habitaciones, tarifas, reportes, personal, inventario, compras, finanzas y activos. Los cambios de personal afectan el acceso de empleados y los cambios de tarifas se reflejan en disponibilidad y reservas.

## Conexiones entre áreas

```text
Web pública ───────────────► Reservas / Huéspedes / Recepción
Portal del huésped ────────► Recepción
Portal del huésped ────────► Room Service
Portal del huésped ────────► Limpieza
Portal del huésped ────────► Mantenimiento
Recepción ─────────────────► Limpieza
Recepción ─────────────────► Mantenimiento
Limpieza ──────────────────► Mantenimiento
Administración ────────────► Tarifas / Habitaciones / Personal / Inventario
Room Service ──────────────► Cuenta del huésped
```

La sincronización operativa actual se realiza mediante stores y eventos del navegador. La traducción automática utiliza la ruta interna `/api/translate` y DeepL cuando existe una clave configurada.

## Documentación adicional

Cuenta, check-out y factura de Recepción: [configuración, alcance y evidencia del issue #12](docs/CUENTA_CHECKOUT_FACTURA.md).
Con `STAFF_AUTH_MODE=spring`, `/panel/recepcion/cuenta` consulta el API mediante el BFF;
`pnpm test:cuenta:connected` verifica el recorrido con un API falso y exporta los PDF de 80 mm y carta.

Consultar [`docs/ACCESO_Y_CONEXIONES.md`](docs/ACCESO_Y_CONEXIONES.md) para una descripción detallada de cada módulo, sus funciones y sus dependencias.
# Tiempo real de operaciones (OBJ-3A-3)

Room Service conserva su modo local cuando `STAFF_AUTH_MODE=demo`. Con
`STAFF_AUTH_MODE=spring`, consulta pedidos y menú mediante el BFF y obtiene un
ticket de un solo uso de Spring con `POST /api/auth/ws-ticket`. Configura
`API_URL` en el servidor y `NEXT_PUBLIC_WS_URL` con el endpoint público `/ws`
(`wss://` cuando la web usa HTTPS). El JWT permanece en cookies httpOnly.

Las pantallas comparten una conexión STOMP por pestaña. Cada intento obtiene
un ticket nuevo y cada conexión restaura suscripciones y recarga los datos:

```tsx
useTiempoReal('/topic/habitaciones', () => recargar(), () => recargar(), conectado);
```

El cliente se basa en los callbacks de conexión y suscripción de
[StompJS](https://stomp-js.github.io/guide/stompjs/using-stompjs-v5.html).
Spring sigue siendo responsable de autorizar CONNECT/SUBSCRIBE, caducar y
consumir tickets y publicar después del commit. El contrato `x-websocket` está
marcado como propuesta: las pruebas con transporte falso no acreditan la
integración con el API ni la app. Cargos, historial y registro telefónico
conservan su funcionamiento demo; este bloque conectado cubre cola, detalle,
avance, cancelación y agotados.

## Incidencias conectadas (OBJ-3B-4)

Con `STAFF_AUTH_MODE=spring`, `/mantenimiento/incidencias` consulta la cola,
permite tomar y resolver con solución obligatoria, y conserva la autorización
por área y técnico. Recepción reporta daños desde `/recepcion/habitaciones`;
ese tablero consulta Spring y se recarga con `/topic/habitaciones`.
Las fotos JPG/PNG de hasta 5 MiB se validan antes de enviar y en el BFF, se
cargan por multipart a `/archivos/imagenes` con uso `INCIDENCIA` y se asocian al
reporte mediante su clave. Spring valida contenido completo, propiedad y
almacenamiento privado; las vistas consumen URLs firmadas.

El catálogo completo de habitaciones para reportar desde MYL está pendiente en
[API #28](https://github.com/villaserenaguatee/villa-serena-api/issues/28).
Mantenimiento solo dispone de las referencias presentes en su cola; Limpieza
no puede seleccionar una habitación aún. No se sustituyen por IDs locales.
Los servicios de API #15 y #21, y la prueba con la app, siguen pendientes.
Estas limitaciones impiden cerrar web #9 y #11 todavía.

Verificación: `pnpm check`, `pnpm test:bff`, `pnpm build` y
`pnpm test:operaciones:browser`. Esta última levanta servicios falsos locales
(puerto 3111 y el siguiente; ajustables con `OPERACIONES_TEST_PORT`), verifica
computadora/móvil y los cierra al terminar. No acredita Spring ni la app real.
