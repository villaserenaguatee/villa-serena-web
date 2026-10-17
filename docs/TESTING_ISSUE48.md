# Migración de pruebas por etapas: #48

Rama de partida: `develop`, commit `2713317` (#53), 09-10-2026.
Primera etapa: infraestructura y tres casos representativos (`e25b7a2`), sin
retirar CJS. Segunda etapa: más pruebas de unidad/componentes sin levantar Next.

Estado actual: siete etapas locales validadas y las etapas octava a decimotercera
implementadas, pendientes de validación de navegador en CI. Los nueve CJS de VM están reemplazados;
Recepción, sesión, pagos y reserva/portal usan Playwright Test en bloques separados. Se conservan siete CJS de
navegador, todos con reemplazos implementados pendientes de validar, además de CI remoto; #48 sigue abierta.
La issue completa continúa pendiente.

## Ejecutar localmente

Usar Node **24.16.0** y pnpm **12.0.0**, las versiones fijadas en CI.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm check
pnpm test:bff
pnpm test:cuenta
pnpm test:unit
pnpm test:component
pnpm test:e2e
```

En Linux, `pnpm exec playwright install --with-deps chromium` instala también las
dependencias del sistema. `pnpm test:ci` ejecuta todos los checks anteriores en
secuencia; presupone que Chromium ya está instalado.

Vitest descubre exclusivamente `tests/unit/**/*.test.ts` y
`tests/component/**/*.test.tsx`. Configura el alias `@/` y la transformación JSX
automática sin alterar el JSX de Next.js. Los componentes se montan con React y
jsdom; Testing Library limpia DOM y localStorage después de cada prueba. Se usa
un worker para limitar el número de entornos jsdom simultáneos.

Las 17 suites TS conservan `node:test` y se ejecutan mediante `test:bff` y
`test:cuenta`. Node 24.16 quita tipos de los módulos directamente; el preload
`tests/bff/register.mjs` solo resuelve `@/`, imports TS sin extensión y dos
límites de Next. Ya no transpila los módulos de la app. La opción
`--experimental-transform-types` soporta propiedades de constructor usadas por
varias dependencias del código. El BFF mantiene `--test-isolation=none`, según
su contrato actual. Algunas suites aún extraen TSX como texto y lo transpilan
explícitamente para VM; no cargan esos componentes como módulos.

El lint de esta etapa cubre los archivos de pruebas y lógica modificados. El lint global
de Next expuso deuda previa en pantallas ajenas a esta migración y queda fuera del
alcance; no se silencian esas reglas para hacer pasar el CI.

Playwright Test administra Chromium, página, contexto y servidor Next.js. Usa
`http://localhost:3048`, un servidor nuevo por ejecución, un worker, sin reintentos,
idioma español y zona horaria `America/Guatemala`. No se necesita iniciar `pnpm dev`.
El servidor fuerza `STAFF_AUTH_MODE=demo`, `VILLA_SERENA_BFF_MODE=demo`, vacía
`API_URL`, `NEXT_PUBLIC_WS_URL` y `DEEPL_API_KEY`, y usa
un archivo temporal único `issue48-e2e-*/reception.json` para recepción. Cada
prueba de Recepción restaura la semilla del BFF eliminando únicamente ese archivo;
el teardown elimina su directorio. No necesita Spring ni secretos.

El proveedor demo de autenticación vive en memoria y se reinicia con Next. La
prueba cambia la contraseña de la cuenta temporal: repetirla dentro del mismo
servidor cambiaría sus precondiciones. Por eso no se reutilizan servidores ni se
aplican reintentos automáticos. No ejecutar simultáneamente dos E2E en este
checkout: comparten puerto y `.next-dev`.
Ejecutar TypeScript después del E2E, no mientras Next regenera `.next-dev/types`.

`pnpm test:e2e` ejecuta Recepción, sesión del personal, pagos, reserva/portal, canales, cuenta y guard conectado de Recepción,
en siete procesos Playwright consecutivos con servidores nuevos. `playwright.config.ts`
selecciona Recepción; los otros seis configs seleccionan explícitamente su bloque. Los
reportes se guardan por bloque en `test-results/{reception,staff,payments,booking,channels,account,reception-api}` y
`playwright-report/{reception,staff,payments,booking,channels,account,reception-api}`, sin sobrescribirse. No iniciar bloques a la vez.

El servidor E2E limita su heap JavaScript a 1536 MiB mediante `NODE_OPTIONS`.
Esto no limita toda la RAM del proceso ni la de Chromium. Next en desarrollo
conserva las rutas compiladas; el primer recorrido de todos los roles puede
necesitar varios minutos. El test dispone de cuatro minutos, con esperas de
aserciones de quince segundos; no se amplían las esperas de un elemento ausente.

## Equivalencia de los tres casos

| Script conservado | Reemplazo | Cobertura |
| --- | --- | --- |
| `test-cuenta-estancia.cjs` | `tests/unit/cuenta-estancia.test.ts` | Siete escenarios financieros, reconstrucción JSON sin mutación, pagos ambiguos y prioridad pendiente/activa/finalizada. Importa las funciones reales; solo fija la tarifa Standard en 420. Conserva la comprobación estática de secciones, que no acredita la UI. |
| `test-email-verification.cjs` | `tests/component/email-verification.test.tsx` | ES/EN, pendiente, código inválido, falta de proveedor, procesando con botones bloqueados, inválido/expirado/verificado, callback solo al verificar, error, reenvío aceptado, cambiar correo, volver y estado inicialmente verificado. Usa hooks y DOM reales y el servicio inyectable del componente. |
| `test-staff-session-browser.cjs` | `tests/e2e/staff-session.spec.ts` | Público, privado sin sesión, rol Recepción, cookies HttpOnly/Lax, ausencia de sesión en localStorage, respuesta mínima de `/yo`, recarga, denegación por rol, renovación y replay, Origin, rutas prohibidas, cierre y bloqueo/cambio de contraseña temporal, destinos y menús de los otros roles. |

El script de sesión quedó obsoleto en #53: espera `Correo` y la bienvenida
`Panel del personal`, mientras el login actual usa `Correo electrónico` y abre el
módulo del rol directamente. El reemplazo comprueba los destinos actuales y
consulta los menús en la página de cambio de contraseña del panel, que conserva
el layout con enlaces autorizados. El cierre también se comprueba en ese layout.
`pnpm test:staff:browser` apunta al reemplazo; el CJS se retiró en la sexta etapa.

## Segunda etapa: componentes y unidad sin Next

Se migraron `test-checkin-documentos.cjs` a
`tests/component/checkin-documentos.test.tsx` (cuatro casos) y
`test-guest-review-click.cjs` a `tests/component/guest-review.test.tsx` (seis casos
ES/EN). Los CJS pasaron antes de la comparación y se retiraron después de
validar sus reemplazos. El visor comprueba también el ciclo de foco con Tab;
jsdom no acredita la geometría visual, pero ejecuta los eventos y hooks reales.
Las únicas APIs de DOM simuladas se fijan en el nodo del área de arrastre:
captura de puntero y `scrollTo`, que jsdom no implementa.

`tests/unit/card-form.test.ts` extrae la detección de marca y las validaciones
ES/EN de `test-guest-profile.cjs`, con fecha explícita, sin transpilar ni VM.
Añade la longitud del CVV de American Express y comprueba ausencia de mutación.
Son quince casos. En esta etapa el CJS de perfil se conservó porque sus formularios,
persistencia y privacidad siguen pendientes de migración completa.

Totales de Vitest: **25 unidad + 22 componentes**, con un worker. Estos comandos
no levantan Next ni Chromium y se incluyen en los jobs existentes de CI. La
[matriz completa](TESTING_CJS_INVENTORY.md) describe los 29 orígenes históricos,
los 27 CJS que quedan y sus destinos propuestos. No se ejecutó nuevamente el
E2E en esta segunda etapa.

## Tercera etapa: perfil y experiencias sin Next

`tests/component/guest-profile.test.tsx` migra los formularios de perfil a React
y DOM reales: diez casos ES/EN de identidad y correo de solo lectura, teléfono
con validación/persistencia/recarga, privacidad informativa, contraseña sin cambio
ni secretos persistidos, tarjeta con metadatos permitidos y eliminación, y foco,
Tab, Escape, X y fondo del modal. Los stores de huéspedes y tarjetas son reales;
la UUID de tarjeta es fija para que un ID aleatorio que contenga el CVV de prueba
no provoque un falso positivo en la comprobación de secretos.

`tests/component/experiences-lifecycle.test.tsx` cubre las 21 opciones actuales,
cuatro estados y dos montajes por estado, propiedad del huésped, historial intacto,
creación local y pérdida de esa creación al remontar. Relee el store canónico
antes de abrir, cancelar o confirmar: el checkout bloquea los handlers de botones
que aún estaban habilitados y las confirmaciones abiertas, aunque exista otra
estancia activa del mismo huésped. Son ocho casos; los dos recorridos largos
tienen timeout local de 15 segundos, sin cambiar el timeout del resto.

Para conservar la aserción de IDs internos sin inspeccionar índices de hooks,
se extrajo `crearExperienciaLocal`, usado por el handler real. Dos pruebas en
`tests/unit/experience-local.test.ts` comprueban el vínculo explícito a huésped y
reserva y los datos de coordinación. El estado local pasó de `any[]` al tipo del
registro; el flujo mantiene su comportamiento.

Ambos CJS pasaron antes y después de la extracción y se retiraron al validar los
reemplazos. La equivalencia usa eventos DOM y guards reales, en lugar de invocar
manualmente el handler de un botón deshabilitado. Totales: **27 unidad + 40
componentes**, con un worker, TypeScript e i18n correctos y JUnit generado con
`CI=true`. No se levantaron Next ni Chromium ni se repitió E2E. Quedan **25 CJS**
en el árbol, incluidos los tres migrados de la primera etapa aún conservados.
El siguiente bloque propuesto es check-in portal y ciclo de reservas.

## Cuarta etapa: check-in portal sin Next

El baseline `node scripts/test-portal-checkin.cjs` falla con `ReferenceError:
checkedCheckIn is not defined`: extrae `validarCheckInWeb` por AST sin su
coordinación asíncrona actual. No se afirma que el CJS completo haya pasado.
Sus escenarios declarados se sustituyen con imports reales y pruebas por
responsabilidad; el CJS se retira tras validar los reemplazos.

Se extrajeron los handlers de envío, rechazo y activación, y la reconciliación de
habitaciones a `src/store/portalCheckIn.ts`, que usan los componentes de huésped y
Recepción. Los estados React se actualizan después de persistir, se mantiene el
bloqueo de solicitudes duplicadas de Recepción y la activación sigue consultando
la condición BFF y revalidando reserva/habitación después del await.

| Escenarios del CJS | Reemplazo comprobado |
| --- | --- |
| Activación, habitación ocupada, evento/selector, recarga, conservación de datos e idempotencia | `tests/unit/portal-checkin.test.ts`: stores reales, selector importado y evento DOM real. |
| Términos, envío, evidencias, habitación asignada/lista y DPI frente/reverso | Guards de stores sin escritura en rechazo; formulario real bloquea avance antes de ambos lados y aceptación. |
| Aprobación/rechazo de Recepción y prioridad de habitación ocupada sobre reserva futura | Coordinación importada, botón real de `DetalleReserva`, rechazo con motivo/evidencias y reconciliación importada. |
| Carga base64, envío/reenviado persistente y error de cuota | FileReader real con pasaporte/DPI, stores reales, remontaje pendiente y error/reintento sin anunciar éxito. |
| Acceso y login del huésped tras activar; cuenta ajena/activación inválida | Store real de acceso y `loginLocal`; cubre la identidad demo local, no autenticación del servidor ni OTP. |
| Reserva confirmada sin habitación/pagos, cupo revalidado y códigos únicos al releer | `crearReservaRecepcionDemo` real con fixtures completos y fechas controladas. |
| Check-in de Recepción, fechas y condición local de habitación | Casos de hoy, entrada futura, salida de hoy, limpieza/mantenimiento/ocupación y conservación de acompañantes. |

Además se comprueban respuesta BFF de habitación sucia/ocupada, fallo HTTP 503 sin
fallback, y reserva o habitación cambiada mientras se consulta. Solo se simula
`fetch`: el cliente HTTP y `requireReadyCheckInRoom` son reales. No se acredita
integración con Spring ni se prueba en navegador el bloqueo de solicitudes
duplicadas del componente de Recepción.

Son **27 casos nuevos de unidad** con entorno jsdom por archivo para los stores
y **9 de componentes**. Los casos de unidad fijan Date y restauran reloj/storage
por test; los componentes ejecutan hooks, eventos y lectura de archivos reales.
Se incluyen automáticamente en los jobs existentes de CI, sin nueva dependencia.
Totales locales: **54 unidad + 49 componentes = 103 pruebas**, TypeScript e i18n
correctos y JUnit generado con `CI=true`. No se levantaron Next ni Chromium.
Quedan **24 CJS**; el siguiente bloque es ciclo de reservas y estancia finalizada.

## Quinta etapa: ciclo de reservas y estancia finalizada

Los CJS de ciclo de reservas y estancia finalizada pasaron antes de migrar.
Se extrajo `modificarReservaRecepcion` a `src/store/reservationModification.ts`,
usado por el handler de Recepción: persiste antes de actualizar React y conserva
la habitación anterior para la liberación/asignación que ya realizaba el handler.
El cambio no modifica el flujo BFF ni acredita persistencia en Spring.

| Escenarios originales | Reemplazo comprobado |
| --- | --- |
| Modificación inmediata y estado pendiente/confirmado | `tests/unit/reservation-lifecycle.test.ts`: helper importado y store real, con asignación y retirada de habitación. |
| Asignación → check-in → checkout, eventos, reconstrucción e idempotencia | Store real y eventos DOM; habitaciones reservada/ocupada/en limpieza, tarea de limpieza única, reserva/huésped/historial intactos y sin duplicados. |
| Guards de habitación y estancia activa | `tests/component/guest-post-stay.test.tsx`: portal completo con React, eventos reales y navegación en estado pendiente, asignado, activo y finalizado. |
| Navegación finalizada y elección de historial al releer | `tests/unit/guest-post-stay.test.ts`: funciones importadas, prioridad de estado, historial más reciente y exclusión de canceladas/ajenas sin mutación. |
| Rutas directas de menú/servicios/check-in/habitación | Páginas importadas, con `next/navigation.redirect` simulado como límite de Next; se comprueba destino y salida de la función, no navegación HTTP. |
| Habitación histórica sin controles, fotografía y tres acciones | `MiHabitacion` real ES/EN; callbacks de operaciones no invocados, sin botones/inputs en fallback cerrado y solo tres acciones en resumen finalizado. |
| Recarga por URL y acciones a reseña/reserva nueva/cuenta final | Portal completo ES/EN, URL real de jsdom, desmontaje/remontaje y clics reales; reserva e identidad persisten sin reactivarse. |

También se verifica que una copia antigua no reactive un checkout persistido y
que finalizar mientras están abiertas Mi estancia, Check-in, Menú o Servicios
sustituya la operación por la cuenta final. Las reservas cerradas/canceladas no
se modifican ni asignan y no emiten escrituras/eventos.

Las pruebas del portal usan `AuthContext.Provider` con una sesión de prueba y
`NextIntlClientProvider` con mensajes reales; no simulan hooks ni `UiText`.
La fecha se controla dentro del plazo de acceso de 24 horas para no probar
accidentalmente la expulsión por caducidad. jsdom muestra ambos menús adaptables:
se pulsa el primero, sin afirmar cobertura de geometría ni viewport móvil.

Se añaden **13 casos de unidad y 12 de componentes**. Se retiraron los dos CJS
nuevos tras comprobar los reemplazos. También se revisaron y ejecutaron otra vez
los CJS de cuenta y correo, ya migrados en la primera etapa: ambos pasaron y se
retiraron. Los nueve orígenes VM del inventario están migrados y fuera del árbol.
Quedan **20 CJS de navegador**; sesión del personal ya tiene reemplazo, los otros
19 aún requieren migración. En esa etapa se conservó el loader Node anterior.

Validación: **67 unidad + 61 componentes = 128 pruebas**, TypeScript e i18n
correctos y JUnit con `CI=true`, con un worker. No se levantaron Next ni Chromium
ni se repitió E2E. El siguiente bloque es E2E de Recepción, que sí requiere ambos.

## Sexta etapa: E2E de Recepción

`pnpm test:reception:browser` administra Next y Chromium para las seis suites
de Recepción; `pnpm test:e2e` incluye también sesión del personal. Las pruebas
usan el BFF demo real, fechas relativas al día del hotel, contextos nuevos y una
semilla de servidor restaurada antes de cada test. Un contexto de navegador nuevo
por sí solo no aísla las reservas o habitaciones del servidor. El archivo temporal
se comparte únicamente entre los workers y Next de la misma ejecución; no se
añadió una ruta HTTP de reset ni se toca `.data/reception-demo.json`.

| Origen CJS | Reemplazo | Cobertura y adaptación al contrato actual |
| --- | --- | --- |
| `test-reception-calendar-browser` | `reception-calendar.spec.ts` + creación | Mes/habitaciones con códigos del BFF, agrupación por piso, encabezados de día, filtros por piso/categoría conservados entre vistas, detalle, nombres de meses y períodos. Creación y navegador nuevo comprueban ambas vistas; sin habitación no hay eventos, pero sí búsqueda y detalle. Cada botón representa una noche, no una reserva distinta. |
| `test-calendar-scroll-browser` | `reception-calendar-layout.spec.ts` | Desktop, móvil y móvil horizontal: alineación, controles externos, modal, scroll vertical/horizontal interno, encabezados y primera columna fijos, sin overflow. El enlace de cuenta comprueba `/panel/recepcion/cuenta`. Guarda geometría y screenshots en `testInfo.outputPath`; el JSON opcional de una ejecución ajena deja de ser precondición. |
| `test-reception-creation-browser` | `reception-creation.spec.ts` | Con/sin habitación, POST único, saldo completo sin pagos, detalle/búsqueda por huésped y código, recarga y recuperación sin copia local; puente de cuenta sin duplicar huésped/estancia, huésped nuevo y respuesta de creación perdida tras doble clic sin repetir POST. |
| `test-reception-operations-browser` | `reception-operations.spec.ts` | Validaciones sin peticiones, filtros y atajos, canal externo/BFF 409, cuenta, historial, acciones por estado, asignación persistida, tres resultados de cancelación demo, habitaciones/condición/filtros, HttpOnly y denegación por rol. Los escenarios mutados se repiten con la misma semilla en desktop/móvil. |
| `test-checkin-room-bff-browser` | `reception-checkin.spec.ts` | Consulta 503 sin fallback ni escrituras, entrada con habitación limpia, persistencia local tras recarga; habitación ensuciada en el BFF después de abrir el detalle bloquea el check-in sin mutaciones. Tras recargar, el detalle BFF bloquea la acción por condición sucia. El check-in aceptado sigue siendo local; no se afirma persistencia de `EN_ESTADIA` en Spring/BFF. No se incorpora `--reproduce` al gate. |
| `test-room-detail-browser` | `room-detail.spec.ts` + permisos de operaciones | Imagen/título abre habitación, identidad y reserva completa, reapertura en la misma URL, otra reserva, recarga, habitación sin estancia, marcar sucia y filtro de condición; permisos 403 en habitaciones, búsqueda y detalle. |

Los scripts antiguos usan etiquetas o credenciales anteriores a #53. La
equivalencia se revisó contra sus escenarios y la UI vigente; esta etapa no afirma
que los CJS completos hayan pasado sin modificaciones. `test-reception-browser`
se conserva por su variante `--api`, aún pendiente: Mes/Semana/Hoy y el Gantt
antiguo ya no describen el calendario actual. Cancelación por canales conserva
su script específico hasta cubrir Booking/Expedia y las copias locales antiguas.

La primera ejecución en frío reveló una carrera real: `/api/auth/yo` sin sesión
podía terminar después del login y borrar sus cookies. El botón de personal ahora
espera a que termine la consulta inicial. Un test retiene esa respuesta, verifica
el bloqueo del botón y después completa el login. Los helpers esperan también
la consulta inicial. No se amplían timeouts para compensar elementos ausentes.

Al ejecutar los 24 casos con un único Next, pasaron los 23 de Recepción, pero Next
reinició por su umbral de memoria al comenzar sesión del personal. Por eso ambos
bloques tienen servidores separados y jobs de CI independientes. Se mantiene el
heap de 1536 MiB y un worker; no se oculta el reinicio mediante reintentos.

Validación final local: `CI=true pnpm test:reception:browser` pasó los **23 casos**
en 7,6 minutos; `CI=true pnpm test:staff:browser` pasó el recorrido de siete pasos
en 1,5 minutos. Ambos escriben JUnit/HTML en su carpeta propia. TypeScript e i18n
pasan con `pnpm check`; el descubrimiento selecciona 23 casos y uno, respectivamente.
Se retiraron **siete CJS** (seis de Recepción y sesión del personal): quedan
**13 scripts de navegador** pendientes. No se ejecutó el workflow remoto.

## Séptima etapa: reserva pública, pagos y portal por código

Cuatro suites sustituyen seis scripts de navegador. `pnpm test:payments:browser`
selecciona 12 casos y `pnpm test:booking:browser` ocho; ambos prueban computadora
y móvil. Los bloques usan servidores nuevos y jobs separados de CI, conservando
un worker, cero reintentos y el heap de Next de 1536 MiB.

| Suite | Escenarios conservados |
| --- | --- |
| `payment-presentation.spec.ts` | Total único, proporciones/orden del layout, condiciones/privacidad, términos, ancho del botón, pago 503, intento guardado, recuperación con el mismo código, una sola creación y pendiente tras recarga. |
| `payment-results.spec.ts` | Cuatro resultados del BFF, orden de acciones, consulta manual visible y feedback, pendiente al minuto, reintento con el mismo código sin nueva reserva, estado actualizado que impide cobrar y fallo sin acusar rechazo bancario. |
| `public-booking.spec.ts` | Entrada desde catálogo/calendario y desde resultados, 15 ofertas, datos/fechas/capacidad inválidos sin petición, tarjeta y términos, datos personales fuera de URL, contrato y número de POSTs, consulta 503 sin confirmación falsa, enlace antiguo sin borrador y recorrido válido hasta pago. |
| `booking-context.spec.ts` | Cookie HttpOnly, código ajeno/navegador externo rechazados, resumen sin OTP, total original, recarga, OTP, sesión válida y portal de la reserva elegida sin mostrar otra estancia. Incluye creación HTTP y recorrido completo desde disponibilidad. |

`public-contract.json` y `bookings.json` viven en el directorio temporal propio
de la ejecución y se eliminan antes de cada caso. La bandeja OTP se dirige a
ese mismo directorio mediante `VILLA_SERENA_GUEST_OUTBOX_PATH`; la variable solo
configura el servidor y mantiene el directorio habitual como valor por defecto.
El test Node de OTP también usa una bandeja temporal y restaura su variable al
terminar. El código se lee desde el proceso de pruebas, nunca desde una respuesta
HTTP del navegador. El teardown elimina el directorio completo de esta ejecución.

Obsolescencias explícitas: la reserva confirmada ahora muestra `Ver mi reserva`
con el código correcto; el CJS compacto esperaba su ausencia. El flujo público
usa `Continuar pago →` y `Consultar estado`, sin el banner anterior `PAGO DE
PRUEBA`. Se conservan las comprobaciones de estado BFF pendiente, consultas
fallidas y parámetros de URL que no pueden confirmar un pago. Las fechas fijas
de los recorridos anteriores se sustituyen por fechas relativas al día del hotel.
No se ejecutaron los CJS antiguos sin cambios ni se presenta esto como validación
de Spring, Stripe, webhook o correo real.

Durante la primera ejecución de reserva, siete casos pasaron y el último falló
por `Unexpected end of JSON input` en `next/dist/server/load-manifest.external.js`.
El trace sitúa el fallo en la lectura del manifiesto de desarrollo de Next, antes
de montar la página. No se filtra ese error ni se habilitan reintentos automáticos;
la validación se repite con otro servidor completo. Este fallo de desarrollo se
registra como limitación, sin atribuirle una corrección que no se ha realizado.
La repetición completa sin cambios en las aserciones pasó **8/8 en 2,2 minutos**.

Validación final: pagos **12/12 en 57 segundos**, reserva/portal **8/8**, BFF
**99/99**, TypeScript e i18n (60 claves). Los XML JUnit de ambos bloques nuevos
registran cero errores/fallos; el YAML de CI se parseó y el descubrimiento de los
bloques existentes sigue seleccionando 23 casos de Recepción y uno de sesión.
No se repitieron esos recorridos existentes ni unidad/componentes en esta etapa.

Se retiran seis CJS tras validar sus reemplazos: quedan siete scripts de navegador
(canales, credenciales, cuenta, Recepción con variante API y dos integraciones con
transportes falsos). Siguen pendientes lint, revisión del loader Node y CI remoto;
la issue #48 permanece abierta.

## Octava etapa: canales y credenciales, pendiente de navegador

Por decisión del usuario, se posponen las ejecuciones locales de Playwright.
Esta etapa prepara código y CI; no acredita equivalencia completa ni retira CJS.
Se conservan los siete scripts anteriores hasta validar sus reemplazos.

| Suite implementada | Escenarios y comprobaciones pendientes de CI |
| --- | --- |
| `channel-cancellation.spec.ts` (8 casos) | Booking/Expedia frente a Recepción/web directa; asignación real, detalle y calendario, recarga, copia local sin canal y rechazo BFF 409 sin cancelar. La vista de cuenta actual no ofrece cancelación para ningún canal; los canales directos conservan el botón en detalle/calendario. |
| `channel-simulator.spec.ts` (2 casos) | Permisos por rol, Booking/Expedia, creación 201, repetición del payload capturado con 200 y mismo código, fechas inválidas sin petición y ausencia de claves de prueba en DOM, almacenamiento y HAR. |
| `login-credentials.spec.ts` (4 casos) | Personal rechaza `demo123`, acepta `VillaSerena26`, rol y cookies HttpOnly; huésped entra por OTP, sin contraseña ni sesión local de personal. Ambos viewports. |
| `payment-polling.spec.ts` (1 caso) | Reloj del navegador controlado: consulta a los tres segundos, parada tras un minuto sin convertir pendiente en rechazo y consulta manual posterior. |

`pnpm test:channels:browser` selecciona los primeros 14 casos y tiene servidor,
JUnit/HTML y job de CI propios. El caso de sondeo pertenece al bloque de pagos,
que ahora contiene 13 casos. Los resultados de pago incluyen también parámetros
`success=true` y `estadoPago=APROBADO` para comprobar que la URL no aprueba el pago.
Los archivos públicos y de Recepción se restauran antes de cada caso de canales;
la lectura del OTP sigue usando la bandeja temporal del servidor.

El simulador configura únicamente claves ficticias de prueba. Se inspecciona HAR
porque Chromium puede descartar cuerpos de respuestas al navegar; el contexto
se cierra antes de leer el archivo. Este artefacto contiene tráfico demo y se
conserva junto al reporte del bloque, sin incluir archivos `.env` ni `.data`.

La ejecución inicial incompleta pasó cuatro casos de canales externos, pero
falló en expectativas de cancelación de la vista de cuenta, selector de alerta y
lectura de cuerpos de respuesta después de navegar. También se interrumpió un
caso de OTP. Se corrigieron esas implementaciones, pero **los reemplazos finales
no han vuelto a ejecutarse**. El servidor de esa ejecución se detuvo; no se deja
Next activo. CI debe validar también pagos y reserva/portal tras los cambios en
sus fixtures compartidos. Un typecheck correcto no demuestra estos recorridos.

Validación ligera de esta etapa: `pnpm check` pasa (TypeScript e i18n, 60 claves)
y `git diff --check` no encuentra errores de formato. No se ejecutaron Next,
Chromium ni el workflow remoto después de las correcciones finales.

## Novena etapa: cuenta demo, pendiente de navegador

Se implementa `tests/e2e/account-demo.spec.ts`: seis escenarios en computadora y
móvil, **12 casos** en total. `pnpm test:cuenta:browser` apunta al reemplazo;
`playwright.account.config.ts` inicia su propio servidor demo y guarda reportes
JUnit/HTML en el bloque `account`. Se añade un job independiente de CI.
No se ejecutan Playwright, Next ni Chromium localmente en esta etapa.

| Escenario del origen | Reemplazo implementado |
| --- | --- |
| Cargo y anulación con historial | Saldo 125 → 175 → 125, cantidad/precio y motivo persistidos, cargo anulado conservado. |
| NIT inválido y CF, pago único | NIT `14-1` bloquea sin mutación; CF registra solo 12500 centavos, referencia, cierre, habitación sucia y cancelación de pedidos/solicitudes. Recarga no duplica el pago. |
| Factura no emitida | Sin artículo ni botón de impresión; conserva la cuenta y permite volver. |
| Factura persistida e impresión | Solo cargos vigentes, total 192500 centavos, CF y referencia; ticket/carta con menús ocultos, montos dentro del ancho, ticket de 72 mm imprimibles y PDFs propios. Recarga no cambia la cuenta. |
| Pedido en camino | Botón de check-out bloqueado, motivo visible y cuenta intacta. |
| Saldo cero/NIT con K | No ofrece método ni añade pago, acepta `6-K` y emite factura con ese NIT. |
| Error de almacenamiento | Falla únicamente la escritura de esta cuenta; alerta en diálogo, saldo y datos intactos, sin factura y persistencia original tras recarga. |
| Móvil y permisos | Cuenta sin overflow, artefactos por viewport; sin sesión redirige al login. Mantenimiento recibe acceso denegado en cuenta/factura, sin saldo, controles ni datos demo guardados. |

Los escenarios usan una semilla local explícita del contexto de prueba y el login
actual `/panel/login`; no dependen del enlace antiguo de demostración. El acceso
por rol actual muestra `Acceso denegado`, en lugar de redirigir una sesión válida
al login como esperaba el CJS. Se mantiene la captura de errores JavaScript del
fixture de Recepción. No se modificó código de producto.

La variante `--api` del origen esperaba `Cuenta pendiente de conexión` para el
código demo. El contrato actual selecciona `AccountConnected` con
`STAFF_AUTH_MODE=spring` y rechaza códigos que no cumplan `VS-[A-Z0-9]{6}`.
Esa expectativa antigua no se copia al bloque demo: la décima etapa implementa
su sustitución y ausencia de fallback local con API falsa. El origen se conserva
hasta validar ambos bloques de cuenta en navegador.

Los doce casos y PDFs están implementados, sin evidencia de ejecución todavía.
Validación ligera: `pnpm check` pasa (TypeScript e i18n, 60 claves),
`git diff --check` pasa y el YAML de CI se parsea con seis bloques E2E únicos y
comandos existentes en `package.json`. CI deberá acreditar los recorridos antes
de retirar el script.

## Décima etapa: cuenta con API falsa, pendiente de navegador

`tests/integration/account-mock.spec.ts` reemplaza el recorrido híbrido de
`test-cuenta-connected.cjs` y cubre la variante API de `test-cuenta-browser.cjs`.
Son seis escenarios en computadora y móvil: **12 casos**. Ambos CJS se conservan
hasta validar los reemplazos; siguen existiendo siete CJS, y los únicos orígenes
sin reemplazo completo implementado son Recepción con variante API y operaciones.

`pnpm test:cuenta:connected` usa `playwright.account-mock.config.ts`;
`pnpm test:integration:mock` lo incluye separado del E2E demo. Playwright administra
un servidor HTTP falso en `127.0.0.1:3049` y Next en `localhost:3048`, con
`STAFF_AUTH_MODE=spring` y `API_URL` apuntando exclusivamente al transporte falso.
No se necesita Spring ni credenciales reales. Cada bloque requiere puerto y
checkout exclusivos; no ejecutarlo en paralelo con otros bloques locales.

El fixture restaura cuenta, factura, llamadas, errores y opciones antes de cada
caso. Sus controles existen únicamente en el proceso de pruebas, no en la app,
y requieren un token aleatorio de la ejecución. El servidor escucha solo en
loopback y cierra conexiones en SIGTERM/SIGINT. Next y Chromium se administran por
Playwright, sin spawn manual ni carpetas globales de evidencia. El launcher usa
el soporte nativo de TypeScript de Node 24; no añade dependencias ni usa el loader
BFF anterior.

| Escenario conservado | Reemplazo implementado |
| --- | --- |
| Cargos y anulación | Web → BFF → HTTP falso, saldo 125 → 175 → 125, payload de cantidad/precio y motivo/historial. |
| Bloqueos y NIT | Preview actualizado al abrir, pedido en camino y NIT `14-1` impiden confirmar, sin POST ni cambios en cuenta. |
| Fallo de factura y doble envío | HTTP 409 deja cuenta/pagos/factura intactos; reintento con doble clic hace un solo POST exitoso y un pago por 125. Contrato no envía monto. |
| Saldo cero | Omite pago y método, conserva pagos previos y permite factura. La semilla de pagos es coherente con su total aprobado. |
| Factura y persistencia | Razón social, dirección, NIT, correo y teléfono provienen del API; solo cargos vigentes/pagos aprobados, recarga intacta y sin cuenta demo en localStorage. |
| Impresión | Ticket/carta, main oculto, sin botones en papel, montos dentro del ancho, ticket de 72 mm imprimibles y PDF/screenshot por caso. |
| Cuenta demo en modo Spring y fallo HTTP | Código demo devuelve 404 sin llamadas de cuenta ni fallback; cuenta válida con 503 no muestra saldo ni check-out ni escribe datos demo. Sustituye la pantalla obsoleta de `--api`. |
| Permisos y Origin | Administración recibe 403 sin llamadas de dominio en el API; cuenta/factura muestran acceso denegado. Origin ajeno no confirma aunque la sesión sea Recepción. |

CI añade `integration-mock-account`, con VM propia, límite de 15 minutos y
artefactos separados en `test-results/account-mock` y
`playwright-report/account-mock`. Este transporte falso **no acredita integración
real con Spring**. No se retiran CJS ni se da por validado el recorrido del BFF.

Validación ligera: TypeScript/i18n pasan (60 claves); el launcher pasa `node --check`.
Se importó el modelo con Node 24 sin abrir sockets y se comprobó en memoria:
fallo sin mutación/cobro, cierre exitoso, saldo cero sin pago adicional y reset de
llamadas/estado. Esto comprueba el fixture, no las interacciones del navegador.
Playwright y el workflow remoto quedan pendientes por decisión del usuario.

## Undécima etapa: variante conectada de Recepción, pendiente de navegador

`test-reception-browser.cjs` reparte sus escenarios demo entre las suites de
calendario, creación y check-in ya migradas en la sexta etapa. Se conserva su
origen hasta validar la variante conectada nueva, sin repetir los recorridos demo
localmente. Las vistas actuales son Mes/Habitaciones; no hay selector Semana ni
botón Hoy, y las reservas sin asignar se encuentran por búsqueda/detalle en lugar
de aparecer en el calendario. Estas obsolescencias no se copian al reemplazo.

`tests/e2e/connected-reception.spec.ts` añade tres escenarios por viewport:
**6 casos**. `pnpm test:reception:api` inicia Next en un bloque propio con
`VILLA_SERENA_BFF_MODE=api`, autenticación demo real y sin API externo. Acredita
el guard de operaciones aún no conectadas; no una conexión Spring funcional.
El nombre del archivo evita que lo seleccione el glob del bloque demo.

| Escenario | Reemplazo implementado |
| --- | --- |
| Módulo de Recepción conectado pendiente | El layout muestra `Recepción pendiente de conexión` y no monta calendario ni acciones; se verifica en recepción y búsqueda, sin alterar los datos locales ni crear el archivo demo del servidor. |
| Búsqueda y detalle | Las rutas conservan el guard explícito mientras los servicios aún no están conectados; las consultas y mutaciones se cubren por HTTP en el caso siguiente. |
| Guard HTTP sin demo de servidor | Consultas de reservas/calendario/disponibilidad/detalle/cancelación/habitaciones y mutaciones de creación/huésped/asignación/cancelación devuelven `API_NOT_READY` 503. Archivo demo del servidor ausente y datos locales intactos. |

No se afirma ausencia de reservas locales: el contrato vigente las conserva y lo
anuncia explícitamente. El test tampoco acredita sincronización o check-in en
Spring. CI añade `e2e-demo-reception-api` con servidor/reportes separados, un
worker y límite de 15 minutos, manteniendo el modo de autenticación demo.

Los seis casos están implementados, **sin ejecutar Playwright**. Se conserva el
CJS hasta validar este bloque y su equivalencia conjunta con las suites demo.
Validación ligera: `pnpm check` pasa (TypeScript e i18n, 60 claves),
`git diff --check` pasa y el YAML de CI se parsea con siete bloques y comandos
existentes en `package.json`.
Después de esta implementación, solo operaciones con API/WebSocket falsos carecía
de reemplazo completo. El loader Node y lint se validaron en la etapa siguiente;
Playwright y CI remoto siguen pendientes.

## Duodécima etapa: operaciones HTTP/STOMP, pendiente de navegador

`test-operaciones-browser.cjs` tiene reemplazo implementado en tres suites:
`operations-orders.spec.ts`, `operations-rooms.spec.ts` y
`operations-maintenance.spec.ts`, dos casos por suite (computadora/móvil),
**6 casos** en total. Se conserva el CJS hasta validar equivalencia. Ya no queda
ningún origen de navegador sin reemplazo implementado; esto no significa que los
siete CJS pendientes puedan retirarse ni que #48 esté completa.

`pnpm test:operaciones:browser` ejecuta los tres bloques consecutivamente, cada uno
con Next y API falso nuevos. Se pueden seleccionar con `test:operaciones:orders`,
`test:operaciones:rooms` y `test:operaciones:maintenance`. Sus configs comparten
`operationsConfig`, pero guardan JUnit/HTML/traces/screenshots en carpetas propias.
`test:integration:mock` ejecuta cuenta conectada y luego estos tres bloques.
Los cuatro tienen jobs de CI en VM separadas, con 15 minutos por job y sin
cancelarse entre sí al fallar. No ejecutarlos simultáneamente en el checkout local.

El servidor HTTP falso escucha exclusivamente en loopback (`127.0.0.1:3049`).
Next usa `STAFF_AUTH_MODE=spring`, API falso y URL WebSocket de prueba. La sesión
se obtiene por el BFF real con credenciales ficticias; los destinos de rol actuales
sustituyen el login/encabezado obsoletos del CJS. No se necesita Spring ni app móvil.
Un token aleatorio protege los controles del fixture; cuenta, pedidos, habitaciones,
incidencias, llamadas, tickets, errores y contadores se restauran por caso según
el bloque correspondiente. Los launchers usan TypeScript nativo de Node 24,
sin ampliar el loader anterior ni añadir dependencias.

| Escenarios del origen | Reemplazo implementado |
| --- | --- |
| Pedido y notificación | Suscripción STOMP `/topic/pedidos`, mensaje con pedido del API falso, aviso y apertura real del detalle. Ticket público contiene solo `ticket`/`expiraEn`. |
| Conflicto, transición y cancelación | 409 conserva NUEVO y muestra recarga; reintento pasa a EN_PREPARACION; cancelación guarda motivo y cierra detalle. |
| Reconexión | Cierre simulado del WebSocket y nueva conexión con ticket distinto; CONNECT no transmite Bearer ni token de acceso. Esperas por condición, sin bucles de sleeps. |
| Menú agotado | Cambio en API falso, desaparece botón de agotar y no ofrece reactivar; comprobación de estado del servidor. |
| Habitación actualizada | Cambio EN_LIMPIEZA/LIMPIA en HTTP falso y evento `/topic/habitaciones` actualizan tarjeta 204. |
| Foto y reporte | Archivo de 6 MiB supera el límite de 5 MB y no sube/reportar; PNG válido produce un upload multipart con uso INCIDENCIA, clave y POST de reporte con ID real 4. |
| Técnico y resolución | Tomar asigna técnico 5; técnico 99 oculta Resolver sin llamada; actualización con técnico 5 permite guardar solución y retira incidencia resuelta. |

`operations-fixtures.ts` administra rutas WebSocket de Playwright y frames
CONNECT/CONNECTED/SUBSCRIBE/MESSAGE/UNSUBSCRIBE. Cada test tiene sus sockets,
suscripciones y tickets; el fixture cierra la página al terminar el recorrido de
tiempo real y registra errores del protocolo y JavaScript. El HTTP falso captura
llamadas y errores, y se cierra al recibir SIGTERM/SIGINT. Los eventos STOMP son
simulados; no se afirma validación de un broker ni de Spring real.

Validación ligera: TypeScript/i18n pasan (60 claves) y el launcher pasa
`node --check`. El modelo importado con Node nativo, sin sockets, comprueba
conflicto sin transición, transición/cancelación, tickets únicos, toma/resolución
y reset de datos/contadores/llamadas. Es una comprobación del fixture, no del BFF,
del WebSocket real ni de los recorridos de interfaz. También pasan
`git diff --check` y el parseo del YAML, con siete bloques E2E y cuatro bloques
mock únicos cuyos comandos existen en `package.json`. Playwright queda pendiente.

## Decimotercera etapa: loader Node y lint

El preload deja que Node 24 quite los tipos de módulos TS y solo resuelve el alias
`@/`, imports sin extensión y dos límites de Next. Se activa
`--experimental-transform-types` para las propiedades de constructor presentes en
el código. La disponibilidad de habitaciones y el modelo del calendario quedaron
en módulos `.ts` puros para que las suites Node no importen páginas TSX. Las
interfaces de página conservan sus exports públicos.

Se añade ESLint 8 con `eslint-config-next` 15 y un job separado en CI. `pnpm lint`
cubre los archivos modificados por esta etapa. El lint global revela errores
preexistentes fuera del alcance y se deja como trabajo separado.

Validación ligera: `pnpm test:bff` pasa 99/99 en unos siete segundos,
`pnpm test:cuenta` pasa 1/1, `pnpm check` (TypeScript e i18n) y `pnpm lint` pasan,
el workflow YAML se parsea y `git diff --check` no encuentra errores. No se
iniciaron Next ni Chromium. Playwright y CI remoto siguen pendientes.

## CI

`.github/workflows/web-tests.yml` se ejecuta en PR hacia `develop`/`main`, push a
`develop` y ejecución manual. Usa permisos de lectura, cancelación por PR/ref,
Ubuntu 24.04, Node 24.16.0, pnpm 12.0.0 y lockfile congelado con caché pnpm.

Checks separados: `typecheck`, `lint`, `i18n`, `unit`, `component`, `node-bff`,
`node-cuenta`, `e2e-demo-reception`, `e2e-demo-staff`, `e2e-demo-payments` y
`e2e-demo-booking`, `e2e-demo-channels`, `e2e-demo-account`,
`e2e-demo-reception-api`, `integration-mock-account`,
`integration-mock-operations-orders`, `integration-mock-operations-rooms` y
`integration-mock-operations-maintenance`. Cada check falla si falla su comando; la matriz no
cancela las otras suites. Vitest escribe JUnit en CI. Playwright escribe JUnit,
reporte HTML, screenshot y trace de fallos. Solo se suben los directorios de
resultados, con retención de siete días; `.data` y `.env` no son artefactos.

Los contratos contra transportes falsos dentro de BFF y los bloques de cuenta/operaciones mock
no acreditan integración real con Spring. No se configura `integration:real` ni
un gate basado en ejecutar todos los CJS por glob.

Si falla el navegador, revisar `playwright-report/<bloque>/index.html` con
`pnpm exec playwright show-report playwright-report/<bloque>` o el trace con
`pnpm exec playwright show-trace <archivo.zip>`. Si el puerto está ocupado,
detener el servidor que lo usa. `pnpm exec playwright test --list` comprueba el
descubrimiento de Recepción sin levantar el servidor; para sesión, usar
`pnpm test:staff:browser --list`. Mantener `playwright` y
`@playwright/test` en la misma versión; versiones diferentes pueden provocar
`Playwright Test did not expect test() to be called here`.

## Baseline y pendientes

El baseline inicial instaló el lockfile correctamente. `pnpm check` falló por
imports ausentes de `Clock3` y `CircleAlert` en `PublicPaymentStatus.tsx`; se
añadieron. BFF pasó 98/99 pruebas: `reception-creation.test.ts` usaba `demo123`
para obtener cookies y esperaba 403 con una sesión inexistente (401). Se actualizó
a `VillaSerena26` y se exige login 200 antes de probar permisos. Tras esas
correcciones, BFF pasa 99/99; `test:cuenta` también pasa.

El E2E detectó además que Administración y Mantenimiento no tenían el
`ScopedI18nProvider` que sí envuelve los otros módulos. Al abrir sus destinos
se producía un error de contexto de `useTranslations`. Se añadieron los dos
proveedores; el test conserva la exigencia de cero errores JavaScript y registra
la URL de cualquier error, sin ocultarlo mediante filtros.

Validación local de esta etapa: instalación con lockfile congelado, TypeScript e
i18n, BFF (99 casos), cuenta con Node, unidad (10 casos), componente (12 casos),
discovery de Playwright y E2E de sesión (un recorrido con siete pasos). El E2E
final pasó en 2,2 minutos incluyendo el servidor, con el heap de Next limitado.
También se verificó la generación de JUnit de Vitest con `CI=true`, y los fallos
del navegador generaron screenshot y trace. El YAML del workflow se parseó
localmente; aún no hay evidencia de ejecución remota en GitHub Actions.

Los CJS representativos de cuenta y correo pasaron y conservaron sus aserciones
en las suites nuevas. Permanecieron para revisión hasta su retirada en la quinta
etapa.

Inventario al comenzar: **29 CJS**, no los 27 de la auditoría inicial. Se añadieron
`test-booking-context-browser.cjs` y `test-selected-public-portal.cjs`.
Clasificación preliminar para las siguientes etapas (no representa una auditoría
completa ni equivalencia comprobada del resto):

La [matriz por archivo y escenario](TESTING_CJS_INVENTORY.md) desarrolla este
inventario, distingue los híbridos y registra obsolescencias y orden de trabajo.

| Grupo previsto | Scripts pendientes |
| --- | --- |
| Componentes con RTL | `test-checkin-documentos` (migrado y retirado), `test-email-verification` (migrado y retirado), `test-experiences-lifecycle` (migrado y retirado), `test-guest-profile` (migrado y retirado), `test-guest-review-click` (migrado y retirado), `test-portal-checkin` (migrado y retirado) |
| Lógica y portal | `test-cuenta-estancia`, `test-reservation-lifecycle`, `test-guest-post-stay` (todos migrados y retirados) |
| Browser con API/frames falsos | `test-cuenta-connected`, `test-checkin-room-bff-browser`, `test-operaciones-browser` |
| Browser demo | `test-booking-context-browser`, `test-selected-public-portal`, `test-calendar-scroll-browser`, `test-channel-cancellation-browser`, `test-cuenta-browser`, `test-demo-staff-password-browser`, `test-payment-channel-browser`, `test-payment-presentation-browser`, `test-payment-results-compact-browser`, `test-payment-valid-flow-browser`, `test-public-booking-browser`, `test-reception-browser`, `test-reception-calendar-browser`, `test-reception-creation-browser`, `test-reception-operations-browser`, `test-room-detail-browser`, `test-staff-session-browser` (migrado) |

Pendiente: validar los siete reemplazos E2E, retirar CJS tras comprobar equivalencia
y ejecutar CI remoto. `pnpm lint` ahora usa ESLint con la configuración de Next 15,
cubriendo los archivos tocados en esta etapa; el lint global todavía reporta errores
preexistentes en pantallas ajenas. También se mantiene la revisión de cobertura móvil
y cualquier integración real aislada que requiera infraestructura; los fixtures mock
no acreditan Spring real.

El workflow está preparado para GitHub; ejecutar y revisar los status checks y
artefactos remotos requiere publicar la rama/PR. Esta etapa no cambia rulesets ni
marca checks obligatorios. La issue #48 permanece abierta hasta completar las
etapas restantes y la validación remota.

Referencias de configuración: [Vitest projects](https://vitest.dev/guide/projects),
[Vitest environment](https://vitest.dev/config/environment),
[Playwright webServer](https://playwright.dev/docs/test-webserver) y
[Playwright configuration](https://playwright.dev/docs/test-configuration).
