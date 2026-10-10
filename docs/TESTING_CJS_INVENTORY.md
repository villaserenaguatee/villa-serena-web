# Inventario de migración CJS — issue #48

Snapshot: scripts de `develop` en `2713317`, conservados en la primera etapa
`e25b7a2`. El snapshot tiene **29 archivos únicos**: 20 utilizan Chromium y nueve
utilizan VM. La segunda etapa retiró documentos y apertura de reseña; la tercera,
perfil y experiencias. La cuarta sustituyó check-in portal. La quinta retira
ciclo de reservas, estancia finalizada y los dos CJS de unidad/componentes ya
migrados en la primera etapa. La sexta reemplaza seis scripts de Recepción y
retira también sesión del personal, ya migrado. La séptima reemplaza seis scripts
de reserva pública, pagos y portal: quedan **siete CJS, todos de
navegador**, en el árbol.
Este inventario clasifica el harness y los escenarios declarados en código;
no afirma que los 29 scripts hayan sido ejecutados ni que sus expectativas
continúen vigentes. Los destinos pendientes son propuestas salvo los reemplazos de canales/credenciales y cuenta demo implementados en
las etapas octava y novena, aún sin validación completa en CI.

Los casos híbridos tienen una sola fila para evitar doble migración. Las
comprobaciones puras de un script de componentes pueden extraerse a unidad,
pero debe mantenerse una relación explícita entre aserción original y reemplazo.

## Matriz de escenarios y destino

Todos los nombres de origen corresponden a `scripts/<nombre>.cjs`.
`E2E demo` usa el BFF demo; `browser mock` incluye transportes falsos y no prueba
Spring real. Solo las filas marcadas **migrado** tienen equivalencia validada.

| Origen | Harness actual | Escenarios que debe conservar el reemplazo | Destino / estado |
| --- | --- | --- | --- |
| `test-booking-context-browser` | E2E demo | Contexto HttpOnly, rechazo de código ajeno y navegador externo, total original, resumen sin OTP, recarga, OTP y acceso a la estancia seleccionada, desktop/móvil. | **Migrado y CJS retirado:** `tests/e2e/booking-context.spec.ts`. Bandeja OTP temporal exclusiva del servidor; contextos ajenos cerrados en finally. |
| `test-calendar-scroll-browser` | E2E demo | Mes/habitaciones, período siguiente/anterior, posiciones del encabezado, modal de creación, scroll vertical/horizontal, encabezados y primera columna fijos, controles externos y tres viewports. | **Migrado y CJS retirado:** `tests/e2e/reception-calendar-layout.spec.ts`. Geometría y screenshots propios; baseline opcional ajeno deja de ser precondición; enlace canónico actual. |
| `test-channel-cancellation-browser` | E2E demo | Booking/Expedia no cancelables en detalle/cuenta/calendario, recarga y copia local antigua sin canal; BFF 409; canales directos siguen cancelables. | **Implementado, pendiente de CI; CJS conservado:** `tests/e2e/channel-cancellation.spec.ts` (8 casos). Cuenta no ofrece cancelación en el contrato actual; detalle/calendario mantienen el permiso por canal. Sin `--reproduce` en el gate. |
| `test-checkin-documentos` | Componentes con hooks falsos / VM | Miniaturas DPI frente/reverso y pasaporte, persistencia JSON, visor, proporciones, zoom/arrastre, navegación, X/Escape, bloqueo de scroll, restauración de foco y reenvío de una imagen fallida. | **Migrado y CJS retirado:** `tests/component/checkin-documentos.test.tsx`. |
| `test-checkin-room-bff-browser` | Browser demo con fallo de transporte inyectado | Habitación sucia rechazada, consulta 503 sin fallback ni mutación local, habitación limpia aceptada, recarga y móvil. | **Migrado y CJS retirado:** `tests/e2e/reception-checkin.spec.ts`. Habitación ensuciada en BFF después de abrir el detalle; bloqueo tras recarga. La entrada aceptada persiste localmente; no acredita Spring. |
| `test-cuenta-browser` | E2E demo / variante `--api` | Cargos/anulación, saldo, NIT inválido/CF/K, pago único, entrega en camino, saldo cero, persistencia, error de almacenamiento, factura e impresión 80 mm/carta, móvil y permisos. | **Demo implementado, pendiente de CI; CJS conservado:** `tests/e2e/account-demo.spec.ts` (12 casos). Variante `--api` pendiente con cuenta mock: contrato actual rechaza el código demo en modo Spring, sin la pantalla antigua. |
| `test-cuenta-connected` | Browser + servidor HTTP falso + Next | Contrato de cargos/anulación/checkout, bloqueos, error de factura sin pago, doble envío, saldo cero, datos fiscales del servidor, impresión, ausencia de cuenta demo local y denegación sin llamadas al API. | `tests/integration/account-mock.spec.ts`, pendiente; requiere fixture propio de API y servidor. |
| `test-cuenta-estancia` | Lógica y extracción AST / VM | Siete saldos, reconstrucción sin mutación, pagos ambiguos, prioridad de estancia y comprobación estática de secciones protegidas. | **Migrado y CJS retirado:** `tests/unit/cuenta-estancia.test.ts`; guards adicionales con portal real en `tests/component/guest-post-stay.test.tsx`. |
| `test-demo-staff-password-browser` | E2E demo | Personal rechaza `demo123`, acepta `VillaSerena26`, rol y cookies; acceso del huésped en desktop/móvil. | **Implementado, pendiente de CI; CJS conservado:** `tests/e2e/login-credentials.spec.ts` (4 casos). Huésped usa OTP y no contraseña. |
| `test-email-verification` | Componentes con hooks falsos / VM | ES/EN, pendiente/procesando/verificado/inválido/expirado/error, falta de proveedor, bloqueo de botones, reenvío, cambiar/volver y ausencia de verificación falsa. | **Migrado y CJS retirado:** `tests/component/email-verification.test.tsx`. |
| `test-experiences-lifecycle` | Componentes con hooks falsos / VM | Categorías, estados confirmada/en-curso/finalizada/cancelada, propiedad del huésped, recarga, modal obsoleto tras checkout, callbacks sin creación y vínculo explícito de la nueva experiencia. | **Migrado y CJS retirado:** `tests/component/experiences-lifecycle.test.tsx` y `tests/unit/experience-local.test.ts`. |
| `test-guest-post-stay` | Extracción AST, rutas y componentes / VM | Navegación según estado, redirects directos, elección de historial, habitación finalizada sin controles, resumen con fotografía y tres acciones que solo navegan, recarga e identidad intacta. | **Migrado y CJS retirado:** `tests/unit/guest-post-stay.test.ts` y `tests/component/guest-post-stay.test.tsx`; rutas importadas con redirect simulado, portal con React real. |
| `test-guest-profile` | Componentes y stores con hooks falsos / VM | Clicks/formularios ES/EN, identidad/correo de solo lectura, teléfono persistente, privacidad, metadata de tarjeta sin PAN/CVV, frontera de contraseña sin secretos, foco/Escape/backdrop e historial intacto; validadores de tarjeta. | **Migrado y CJS retirado:** `tests/component/guest-profile.test.tsx` y `tests/unit/card-form.test.ts`. |
| `test-guest-review-click` | Componentes con hooks falsos / VM | Botón real abre/cierra reseña ES/EN, dos campos, apertura sin escritura, apertura solicitada por prop y guard de estancia finalizada. | **Migrado y CJS retirado:** `tests/component/guest-review.test.tsx`; no es browser. |
| `test-operaciones-browser` | Browser + API HTTP falso + frames STOMP falsos + Next | Pedido/notificación, conflicto y transición, cancelación, reconexión con ticket nuevo, menú agotado, cambios de habitación, límites de foto/upload, incidencia y resolución por técnico propio, desktop/móvil. | `tests/integration/operations-mock.spec.ts`, pendiente; fixtures de API y WebSocket con teardown. |
| `test-payment-channel-browser` | E2E demo | Cuatro resultados, URL no aprueba pago, reintento, polling y parada, permisos, envío/repetición 201/200, fechas inválidas sin petición, secretos de canal ausentes y sin overflow. | **Implementado, pendiente de CI; CJS conservado:** `payment-results.spec.ts`, `payment-polling.spec.ts` y `channel-simulator.spec.ts`. Pendiente no pasa a rechazo al minuto; HAR inspecciona cuerpos y claves ficticias. |
| `test-payment-presentation-browser` | E2E demo con respuesta de pago 503 | Total único, layout desktop/móvil, condiciones/privacidad, botón sujeto a términos, recuperación del intento guardado sin crear otra reserva y estado pendiente tras recarga. | **Migrado y CJS retirado:** `tests/e2e/payment-presentation.spec.ts`. Un archivo BFF restaurado por test; verifica una sola creación tras el 503 y recuperación. |
| `test-payment-results-compact-browser` | E2E demo con respuestas de estado falsas | Cuatro resultados, acciones/orden, ausencia de overflow, consulta visible, minuto pendiente, reintento del mismo código y estado actualizado que prohíbe enviar pago. | **Migrado y CJS retirado:** `tests/e2e/payment-results.spec.ts`. Confirmada ahora muestra enlace al resumen con su código; pendiente nunca se confirma por `paid=true`; estado actualizado cancelado impide POST. |
| `test-payment-valid-flow-browser` | E2E demo | Enlace antiguo sin draft bloqueado, disponibilidad → datos → revisión → pago, términos, total único y responsive. | **Migrado y CJS retirado:** caso de entrada/revisión en `tests/e2e/public-booking.spec.ts`, fechas relativas al hotel y artefacto JSON del recorrido. |
| `test-portal-checkin` | Hooks, handlers, stores y extracción AST / VM | Activación/acceso del huésped, documentos y términos, persistencia, aprobación por Recepción, conservación de datos, reserva sin habitación/pagos, cupo revalidado, fechas y condición de habitación, idempotencia. | **Migrado y CJS retirado:** `tests/unit/portal-checkin.test.ts` (jsdom para stores) y `tests/component/portal-checkin.test.tsx`. Baseline antiguo falla al extraer el handler asíncrono de Recepción; equivalencia por matriz declarada y comportamiento actual, sin afirmar que el CJS completo pasa. |
| `test-public-booking-browser` | E2E demo | Dos entradas al flujo, catálogo/ofertas, calendario, fechas y datos inválidos sin peticiones, correo/draft, tarjeta/términos, PII fuera de URL, envío y consulta BFF pendientes, desktop/móvil. | **Migrado y CJS retirado:** `tests/e2e/public-booking.spec.ts`. Ambos recorridos con códigos distintos, payload/POSTs exactos, fallo 503 de estado sin confirmación y textos compactos actuales. |
| `test-reception-browser` | E2E demo / variante `--api` | Navegación mes/semana/Hoy, creación sin pago, Gantt, check-in limpio, recarga, rechazo por habitación no lista y móvil. | Distribuir en calendario/creación/check-in sin perder escenarios, pendiente; revisar UI y login antiguos antes de retirar. |
| `test-reception-calendar-browser` | E2E demo | Mes/habitaciones, filtros por piso/tipo, búsqueda por huésped, reservas sin asignar, detalle, creación y persistencia, interacción y viewports. | **Migrado y CJS retirado:** `tests/e2e/reception-calendar.spec.ts` + `reception-creation.spec.ts`. Un botón por noche; reservas sin habitación accesibles por búsqueda/detalle y ausentes de ambas vistas. |
| `test-reception-creation-browser` | E2E demo | Nueva reserva con/sin habitación, búsqueda/calendario/detalle/recarga, recuperación sin copia local, huésped existente sin duplicar, huésped nuevo, respuesta perdida y doble click. | **Migrado y CJS retirado:** `tests/e2e/reception-creation.spec.ts`. Ambos viewports y ambas vistas del calendario; archivo BFF aislado por ejecución y restaurado por test. |
| `test-reception-operations-browser` | E2E demo | Filtros, historial, acciones según estado/canal, asignación, cancelación, habitaciones y permisos de página/BFF, desktop/móvil. | **Migrado y CJS retirado:** `tests/e2e/reception-operations.spec.ts`. Ninguna aserción acredita devolución real; incluye regresión de carrera entre consulta inicial de sesión y login. |
| `test-reservation-lifecycle` | Stores, eventos y extracción AST / VM | Persistencia inmediata de modificación/asignación, selección portal, evento, habitación reservada/ocupada/en limpieza, check-in/out, reconstrucción e idempotencia sin duplicar ni alterar huésped/historial; guards. | **Migrado y CJS retirado:** `tests/unit/reservation-lifecycle.test.ts` (jsdom) y guards del portal real en `tests/component/guest-post-stay.test.tsx`. |
| `test-room-detail-browser` | E2E demo | Habitación → reserva completa, identidad, reapertura en misma URL, cambio de reserva, recarga, habitación sin reserva, filtro condición, permisos y móvil. | **Migrado y CJS retirado:** `tests/e2e/room-detail.spec.ts`; permisos de API/página en `reception-operations.spec.ts`. |
| `test-selected-public-portal` | E2E demo | Disponibilidad → datos → pago pendiente → resumen → OTP → portal de código seleccionado; recarga sin mostrar otra estancia, desktop/móvil. | **Migrado y CJS retirado:** segundo caso de `tests/e2e/booking-context.spec.ts`. Datos, BFF y OTP reales en modo demo; no falsifica un pago confirmado. |
| `test-staff-session-browser` | E2E demo | Público/privado, roles/menús, cookies y respuesta mínima, recarga, denegación, refresh/replay, Origin, cierre y contraseña temporal. | **Migrado y CJS retirado:** `tests/e2e/staff-session.spec.ts`. |

## Dependencias y obsolescencias

- Los 20 scripts browser del snapshot no comparten servidor/baseURL; los puertos van de 3000
  a 3124 (y los API falsos usan el siguiente puerto). Los dos scripts de contexto
  público fijan 3035 directamente. Normalizar a fixtures, no activar por glob.
- Solo `test-cuenta-connected` y `test-operaciones-browser` levantan su propio
  servidor HTTP falso y Next. `test-checkin-room-bff-browser` modifica respuestas
  de una petición del browser a un BFF demo existente: pertenece a E2E demo con
  fallos inyectados, no a integración Spring.
- Los nueve scripts VM son híbridos de lógica/React/stores/AST. En particular,
  `test-guest-post-stay` y `test-guest-review-click` no utilizan Chromium.
- Los scripts que esperan `Panel del personal`, `Correo` o la contraseña antigua
  necesitan actualización tras #53; no trasladar esos selectores literalmente.
  `test-cuenta-browser` y `test-reception-browser` entran por `/login` con
  placeholders anteriores; deben comprobar el tab de personal y el login actual.
- `test-payment-channel-browser` espera títulos anteriores y que el polling
  pendiente termine como fallo al minuto, mientras el caso compacto espera
  que permanezca pendiente. Resolver con el comportamiento/contrato vigente;
  no conservar dos expectativas incompatibles para el mismo estado.
- Varios escenarios alteran el estado del servidor (habitaciones, inventario,
  canales, reservas). Los contextos separados solo aíslan cookies/storage del
  navegador. La migración necesita reset/factories de datos por test y debe
  evitar repetir fixtures mutadas entre escritorio y móvil.
- Los JSON de baseline visual opcional y las carpetas de screenshots presuponen
  estado externo. La suite nueva debe declarar los fixtures y crear artefactos
  con `testInfo.outputPath`, incluyendo PDFs cuando forman parte de la prueba.
- El recorrido público/contexto/portal comparte pasos con presentación y pago,
  pero prueba fronteras distintas: autorización por código, OTP, recuperación
  idempotente, entrada inválida y presentación. Extraer helpers; no eliminar
  escenarios por parecer similares.

## Orden propuesto

1. **Completado:** componentes sin Next para visor de documentos y apertura de
   reseña; validadores de tarjeta en unidad. Los tres CJS de referencia pasaron
   antes de la migración; los reemplazos pasan. Los dos reemplazados por completo
   se retiraron en la segunda etapa.
2. **Perfil, experiencias y check-in portal completados:** stores y hooks React
   reales, restauración por test y guards explícitos. Portal usa el cliente HTTP
   real con respuestas simuladas para consultar la condición de habitación.
3. **Ciclo de reservas y estancia finalizada completados:** imports/stores reales,
   modificación extraída, eventos DOM, guards y acciones del portal con React.
   Los nueve orígenes VM ya están reemplazados y retirados.
4. **Recepción completada:** seis suites con estado BFF aislado y login actual,
   desktop/móvil y geometría en tres viewports. Sesión del personal tiene un
   servidor y job separados para evitar acumular compilaciones sobre el límite
   de heap.
5. **Reserva pública, pagos y contexto/portal completados:** cuatro suites y dos
   bloques de servidor; archivos BFF y bandeja OTP aislados. Seis CJS retirados;
   canales, credenciales y cuenta de navegador siguen pendientes.
6. Integración browser mock: API HTTP/STOMP como fixtures dedicados. Spring real
   necesita infraestructura y datos aislados, fuera del gate inicial.

Publicar la rama y ejecutar el workflow en PR draft es una validación adicional
de la infraestructura; no exige esperar a migrar los CJS pendientes. El PR parcial
debe describir la etapa y referenciar #48 sin cerrarla.
