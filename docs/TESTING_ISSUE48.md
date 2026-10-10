# Pruebas: primera etapa de #48

Rama de partida: `develop`, commit `2713317` (#53), 09-10-2026.
Primera etapa: infraestructura y tres casos representativos (`e25b7a2`), sin
retirar CJS. Segunda etapa: más pruebas de unidad/componentes sin levantar Next.
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

Las 17 suites TS anteriores conservan `node:test` y el loader
`tests/bff/register.mjs`, mediante `test:bff` y `test:cuenta`. No se incluyen en
Vitest ni se ejecutan dos veces. El BFF mantiene `--test-isolation=none`, según su
contrato actual. La retirada del loader requiere una etapa posterior: varias
pruebas todavía extraen código y ejecutan TSX mediante VM.

Playwright Test administra Chromium, página, contexto y servidor Next.js. Usa
`http://localhost:3048`, un servidor nuevo por ejecución, un worker, sin reintentos,
idioma español y zona horaria `America/Guatemala`. No se necesita iniciar `pnpm dev`.
El servidor fuerza `STAFF_AUTH_MODE=demo`, `VILLA_SERENA_BFF_MODE=demo`, vacía
`API_URL`, `NEXT_PUBLIC_WS_URL` y `DEEPL_API_KEY`, y usa
`.data/issue48/reception.json` para recepción. No necesita Spring ni secretos.

El proveedor demo de autenticación vive en memoria y se reinicia con Next. La
prueba cambia la contraseña de la cuenta temporal: repetirla dentro del mismo
servidor cambiaría sus precondiciones. Por eso no se reutilizan servidores ni se
aplican reintentos automáticos. No ejecutar simultáneamente dos E2E en este
checkout: comparten puerto y `.next-dev`.

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
`pnpm test:staff:browser` apunta al reemplazo; el CJS sigue disponible como referencia.

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
19 aún requieren migración. El loader de los tests Node BFF existentes se conserva.

Validación: **67 unidad + 61 componentes = 128 pruebas**, TypeScript e i18n
correctos y JUnit con `CI=true`, con un worker. No se levantaron Next ni Chromium
ni se repitió E2E. El siguiente bloque es E2E de Recepción, que sí requiere ambos.

## CI

`.github/workflows/web-tests.yml` se ejecuta en PR hacia `develop`/`main`, push a
`develop` y ejecución manual. Usa permisos de lectura, cancelación por PR/ref,
Ubuntu 24.04, Node 24.16.0, pnpm 12.0.0 y lockfile congelado con caché pnpm.

Checks separados: `typecheck`, `i18n`, `unit`, `component`, `node-bff`,
`node-cuenta` y `e2e-demo`. Cada check falla si falla su comando; la matriz no
cancela las otras suites. Vitest escribe JUnit en CI. Playwright escribe JUnit,
reporte HTML, screenshot y trace de fallos. Solo se suben los directorios de
resultados, con retención de siete días; `.data` y `.env` no son artefactos.

Los contratos contra transportes falsos dentro de BFF y los scripts híbridos
no acreditan integración real con Spring. No se configura `integration:real` ni
un gate basado en ejecutar todos los CJS por glob.

Si falla el navegador, revisar `playwright-report/index.html` con
`pnpm exec playwright show-report` o el trace con
`pnpm exec playwright show-trace <archivo.zip>`. Si el puerto está ocupado,
detener el servidor que lo usa. `pnpm exec playwright test --list` comprueba el
descubrimiento sin levantar el servidor. Mantener `playwright` y
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

Pendiente: lectura y ejecución completa del resto, matriz de aserciones por
dominio, migración de browser, retirada de CJS y revisión del loader Node, reparación de
`lint: next lint` con una configuración ESLint acordada, cobertura móvil cuando
corresponda, fixtures de integración mock y entorno real aislado.

El workflow está preparado para GitHub; ejecutar y revisar los status checks y
artefactos remotos requiere publicar la rama/PR. Esta etapa no cambia rulesets ni
marca checks obligatorios. La issue #48 permanece abierta hasta completar las
etapas restantes y la validación remota.

Referencias de configuración: [Vitest projects](https://vitest.dev/guide/projects),
[Vitest environment](https://vitest.dev/config/environment),
[Playwright webServer](https://playwright.dev/docs/test-webserver) y
[Playwright configuration](https://playwright.dev/docs/test-configuration).
