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
Son quince casos. El CJS de perfil se conserva porque sus formularios,
persistencia y privacidad siguen pendientes de migración completa.

Totales de Vitest: **25 unidad + 22 componentes**, con un worker. Estos comandos
no levantan Next ni Chromium y se incluyen en los jobs existentes de CI. La
[matriz completa](TESTING_CJS_INVENTORY.md) describe los 29 orígenes históricos,
los 27 CJS que quedan y sus destinos propuestos. No se ejecutó nuevamente el
E2E en esta segunda etapa.

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

Los CJS representativos de cuenta y correo pasan y conservan sus aserciones en
las suites nuevas. Su retirada se deja para la siguiente etapa, tras revisión.

Inventario al comenzar: **29 CJS**, no los 27 de la auditoría inicial. Se añadieron
`test-booking-context-browser.cjs` y `test-selected-public-portal.cjs`.
Clasificación preliminar para las siguientes etapas (no representa una auditoría
completa ni equivalencia comprobada del resto):

La [matriz por archivo y escenario](TESTING_CJS_INVENTORY.md) desarrolla este
inventario, distingue los híbridos y registra obsolescencias y orden de trabajo.

| Grupo previsto | Scripts pendientes |
| --- | --- |
| Componentes con RTL | `test-checkin-documentos`, `test-email-verification` (migrado), `test-experiences-lifecycle`, `test-guest-profile`, `test-guest-review-click`, `test-portal-checkin` |
| Lógica y portal (revisión híbrida pendiente) | `test-cuenta-estancia` (migrado), `test-reservation-lifecycle`, `test-guest-post-stay` |
| Browser con API/frames falsos | `test-cuenta-connected`, `test-checkin-room-bff-browser`, `test-operaciones-browser` |
| Browser demo | `test-booking-context-browser`, `test-selected-public-portal`, `test-calendar-scroll-browser`, `test-channel-cancellation-browser`, `test-cuenta-browser`, `test-demo-staff-password-browser`, `test-payment-channel-browser`, `test-payment-presentation-browser`, `test-payment-results-compact-browser`, `test-payment-valid-flow-browser`, `test-public-booking-browser`, `test-reception-browser`, `test-reception-calendar-browser`, `test-reception-creation-browser`, `test-reception-operations-browser`, `test-room-detail-browser`, `test-staff-session-browser` (migrado) |

Pendiente: lectura y ejecución completa del resto, matriz de aserciones por
dominio, migración incremental, retirada de VM/loader, reparación de
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
