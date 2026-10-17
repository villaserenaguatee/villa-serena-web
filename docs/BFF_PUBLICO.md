# Reserva pública con datos de prueba — Issue #5

Las pantallas públicas consultan el BFF de Next.js. Esta etapa funciona con datos
de prueba: **no conecta Spring ni Stripe y no verifica un pago real**.
Se conservaron las 15 ofertas, imágenes y estilos. El recorrido público admite
únicamente tarjeta mediante Stripe, también en la simulación. Pasa de datos a resumen sin exigir una cuenta ni
verificación de correo; las pantallas anteriores de verificación siguen disponibles.

Fuentes: [Issue #5](https://github.com/villaserenaguatee/villa-serena-web/issues/5),
[Issue #18](https://github.com/villaserenaguatee/villa-serena-web/issues/18),
[Issue #13](https://github.com/villaserenaguatee/villa-serena-web/issues/13) y
[PR #15 integrado](https://github.com/villaserenaguatee/villa-serena-web/pull/15).
El contrato es `openapi.yaml`; los DTO se toman de `src/lib/api/schema.d.ts`.
Esta rama parte de `develop` y no modifica el trabajo del PR #19.

## Peticiones según contrato

El prefijo del BFF es `/api/publico`; el de la API futura es `/api/v1/publico`.
Los métodos, consultas y DTO conservan los nombres del contrato:

| Método y ruta del BFF | Uso |
| --- | --- |
| `GET /api/publico/hotel` | Información del hotel en inicio |
| `GET /api/publico/tipos-habitacion` | Catálogo |
| `GET /api/publico/tipos-habitacion/{id}` | Detalle de tipo preparado |
| `GET /api/publico/disponibilidad?entrada=…&salida=…&numeroHuespedes=…` | Disponibilidad, noches, total y desglose |
| `POST /api/publico/reservas` | Tipo, fechas, número de huéspedes y seis datos del huésped |
| `POST /api/publico/reservas/{codigo}/pago` | Inicio o recuperación del pago, sin cuerpo |
| `GET /api/publico/reservas/{codigo}/estado` | Estado de reserva y pago, sin datos personales |

No existe una ruta de precio separada: la disponibilidad devuelve la cotización.
El servidor fija el precio usando las tarifas base existentes. Las fixtures no
activan nuevos recargos: temporada nula y ajuste de fin de semana del 0 %;
el desglose identifica viernes y sábado. Las políticas reales quedan para la API.
El resumen vuelve a consultar el precio; el total de la URL no autoriza un cobro.

Los cinco IDs de tipo son exclusivos de estas fixtures. Las 15 ofertas visuales
se presentan sobre esos tipos; su capacidad se limita a la del catálogo/inventario.
La asociación con los IDs, nombres e imágenes reales deberá validarse antes de
activar la API. No se presupone que los IDs de prueba coincidan con los reales.

## Validación y pago de prueba

Se comprueban fechas reales, llegada no pasada, salida posterior, 1–30 noches,
llegada dentro de 365 días y huéspedes enteros, al menos un adulto, sin superar
la capacidad. Una búsqueda inválida muestra el motivo y no solicita disponibilidad.
El BFF revalida antes de crear, incluyendo los seis campos obligatorios y sus
límites del contrato. Reutiliza el perfil existente por correo sin modificarlo.
Los POST nuevos exigen `Origin` del mismo sitio; una petición ajena devuelve 403.

Stripe conserva los estados del contrato: creación `PENDIENTE_PAGO`, pago
`PENDIENTE`, vencimiento a los 30 minutos y liberación del cupo al vencer.
El código sigue `VS-` más seis caracteres alfanuméricos. La simulación devuelve
una URL local de prueba en `/reserva/resultado?codigo=…&prueba=1`, ruta prevista
para el regreso de Stripe. La pantalla muestra **Pago de prueba**, consulta el
estado por GET y permanece pendiente. Navegar, recargar, volver o añadir
`paid=true` no aprueba el pago. Un fallo de consulta muestra error y permite
reintentar solo el GET. No se recogen números de tarjeta ni CVV.

Las respuestas exitosas llevan `X-Villa-Serena-Mode: demo` y `Cache-Control:
no-store`. La reserva/pago de prueba queda en `.data/public-stripe-demo.json`,
o en `VILLA_SERENA_PUBLIC_CONTRACT_PATH`, separado del estado demo de hotel.
La creación comparte el bloqueo de inventario del bloque #13. Los archivos
corruptos o bloqueados fallan explícitamente, sin reiniciar el estado.
Esta persistencia requiere Node y disco compartido en un host; no reemplaza
las transacciones de la API ni sirve como persistencia distribuida.

El borrador por pestaña mantiene los datos personales fuera de la URL. Un POST
incierto conserva su intento para recuperación manual. En prueba se usa la
cabecera `Idempotency-Key`; **el contrato real no la define**. Esa garantía debe
acordarse con la API antes de conectar creación real. No hay reintentos POST
automáticos. Si ya se conoce el código, la recuperación solo retoma el pago.

## Compatibilidad y pendientes

El recorrido público ya no ofrece ni crea reservas para pagar en el hotel, ni
recupera intentos anteriores usando ese método. Siempre usa creación e inicio
de pago con los DTO del contrato. La simulación de Stripe no genera la copia
local heredada ni una reserva confirmada. Se conservan las reservas anteriores,
sus consultas y los servicios heredados de #13 para compatibilidad. El antiguo
`POST /api/public/bookings` rechaza nuevas altas con `PUBLIC_CARD_ONLY` (409);
solo admite recuperar una reserva ya guardada mediante su `recoveryCode`. Sus cupos
persistidos siguen contando. No se modifican las reservas ni los pagos de Recepción.
La selección visual por piso aún utiliza el BFF demo `/api/public/availability`.

El contrato actual no incluye pago en hotel, promociones, piso ni selección de
habitación concreta en creación pública. No se envían campos inventados al DTO
de Stripe; piso y oferta son presentación demo.
Se retiró la opción pública de transferencia/depósito. No se implementa banco.
Las decisiones de #18 y la asociación real del catálogo siguen pendientes.

`VILLA_SERENA_BFF_MODE=api` devuelve 503 explícito. No hace fallback a fixtures.
Falta conectar y validar la API real, obtener la URL de Stripe Checkout, realizar
la redirección y comprobar que un pago de prueba confirmado por el webhook se
refleja en la consulta de estado. El tercer criterio de #5 **no se presenta como
realizado**: un regreso simulado no demuestra la confirmación tras el pago.

## Comprobación

`pnpm test:bff` incluye pruebas de contrato, precio, validación, Origin, intento
repetido, respuesta perdida, cupo, vencimiento y consulta sin confirmación falsa,
además de las pruebas existentes. `pnpm check` y `pnpm build` comprueban tipos,
traducciones y compilación de producción.

Para probar las pantallas, ejecuta `pnpm test:booking:browser` y
`pnpm test:payments:browser`, uno después del otro. Playwright administra Next
y Chromium en 1440×1000 y 390×844: inicio, catálogo, búsqueda, datos, resumen,
pago pendiente, regreso, errores de consulta, recuperación sin duplicados,
validación sin peticiones, ausencia de desbordamiento y tarjeta como única opción.
El bloque de reserva incluye el contexto HttpOnly y acceso OTP al portal de la
reserva elegida. Usa archivos demo y bandeja OTP temporales; no requiere `pnpm dev`.
Las capturas y reportes se guardan en `test-results/{booking,payments}` y
`playwright-report/{booking,payments}` (ignorados por Git).
Estas comprobaciones son **simuladas**, no una validación de Spring ni Stripe.
