> Nota de entrega: este informe registra una fase previa. Para la conciliación, dependencias y estado actual, consulta [ENTREGA_FRONTEND_PENDIENTES.md](ENTREGA_FRONTEND_PENDIENTES.md).

# Issue #61: checkout público con Recurrente

## Alcance y base

Implementación local en `feat/issue-61-recurrente`. La rama se actualizó por avance
rápido hasta `c8134d0810fc67d912e782e7c6e8d546503c5602`, que incluye las mejoras
visuales aprobadas y contiene `origin/develop` (`b1ef1557514004c860f814eddb24d986be6c21f0`).
No se incorporaron los seis cambios de contacto pendientes del otro worktree.
No se modificaron los repositorios API o docs, ni se crearon commits o Issues.

Contrato canónico: `villa-serena-docs` en
`1fa07d480b749c12ed20c8fff09b526a1c584928`, fijado en `api-contract.json`.
Generación mediante las herramientas existentes; no se añade un OpenAPI local.
El CI consume la revisión del manifiesto, no una rama móvil.

## Cambios del frontend

- `publicBookingPayment.ts` sustituye el módulo con nombre Stripe. Conserva la
  identidad idempotente, el borrador y la verificación de correo existentes.
  Comparte una sola promesa por borrador para llamadas simultáneas. Antes de
  recuperar una reserva conocida consulta su estado; no crea ni cobra al cargar.
- `checkoutUrl.ts` admite únicamente HTTPS de `app.recurrente.com` y la ruta de
  checkout alojado esperada, sin credenciales, puertos, fragmentos ni redirecciones
  por query. El destino local de demostración queda separado por modo y origen.
- Pago muestra Recurrente y utiliza `urlPago`/`expiraEn` del contrato. GTQ, monto,
  disponibilidad y aprobación permanecen bajo responsabilidad del servidor.
- Resultado consulta el endpoint oficial; parámetros como `paid` o `success`
  nunca aprueban un pago. Conserva consulta manual y sondeo acotado. Una caída
  de conexión no se interpreta como rechazo. Confirmación o cancelación limpia
  únicamente el borrador correspondiente al código consultado.
- `PENDIENTE` permite consultar, no iniciar otro cobro. Los reintentos vuelven a
  consultar el estado antes del POST y respetan conflictos del servidor.
- Se retiran extensiones de estado no incluidas en OpenAPI. Se conservan lectura
  de intentos Stripe anteriores, enumeración histórica y ruta del archivo demo
  persistido; nunca se convierten automáticamente en nuevos pagos Recurrente.
- El consumidor compartido del saldo utiliza la misma validación de destino.
  No se cambian el endpoint ni las reglas del saldo.
- Se conservan tarjeta compartida, condiciones, privacidad y ausencia de
  «Descartar datos de reserva», sin rediseñar pantallas.

## Validación

Resultados locales de esta revisión:

| Comprobación | Resultado |
| --- | --- |
| `pnpm generate:api` y `pnpm check:api` | Pasan; tipos regenerados desde el SHA fijado |
| Pruebas del consumidor del contrato | 5/5 pasan |
| TypeScript e i18n | Pasan; 60 claves ES/EN coinciden |
| Lint | Pasa, 0 errores y 276 avisos; los avisos en Pago y paymentResult ya estaban en la base |
| Compilación de producción | Pasa, salida 0; 66 páginas generadas |
| Pruebas BFF | 137/137 pasan |
| Pruebas unitarias | 66/66 pasan |
| Pruebas de componentes | 70/70 pasan |
| Navegador, pagos en escritorio y móvil | 17/17 pasan |
| Repetición final de los nuevos recorridos, tras esperar el precio antes de capturar | 4/4 pasan |
| `git diff --check` | Pasa |

El recorrido nuevo cubre Datos → Revisión → verificación simulada → Pago →
destino alojado interceptado → Resultado. Comprueba doble clic, regreso con
parámetros falsos de aprobación, pendiente, consulta posterior, confirmación y
limpieza del borrador. Las otras pruebas cubren recarga, cancelación antes del
reintento, fallo de conexión y conservación de una reserva histórica sin inventar
la aprobación del pago. Se rechazan destinos Stripe, orígenes parecidos,
credenciales en URL, puertos, protocolos y rutas no autorizados.

Se corrigieron dos expectativas de pruebas: un selector ambiguo que también
encontraba el anunciador de Next y un texto de vencimiento que no podía deducirse
del contrato. La ruta de entrada a Datos necesita los parámetros públicos de
fechas y huéspedes además del identificador de borrador. No se cambió la pantalla
para eludir esas validaciones. La prueba de Git requirió ejecutarse con el usuario
propietario: el usuario aislado de Windows no podía clonar el checkout de docs.

Las capturas locales de Pago y Resultado se guardan bajo `.local`, fuera de Git.
La distribución no desborda en ambos tamaños. La fotografía externa del resumen
no cargó en el entorno de navegador utilizado; se conserva su URL y componente
sin sustituirla por otra imagen. Esta limitación visual no se declara resuelta.

Las pruebas de navegador usan BFF demo aislado y respuestas de
protocolo controladas. Ninguna pantalla simulada acredita un checkout Sandbox.
Los códigos/destinatarios de fixtures no se envían a proveedores.

Archivos: `api-contract.json`, `docs/CONTRATO_API.md`, este informe,
`src/lib/api/schema.d.ts`, `src/lib/api/public.ts`,
`src/lib/bff/contracts/public.ts`, `src/lib/bff/publicContract.ts`,
`src/lib/bff/publicContractStore.ts`, `src/lib/bookingDraft.ts`,
`src/lib/paymentResult.ts`, `src/lib/publicBookingPayment.ts` (antes
`publicStripeBooking.ts`), `src/lib/checkoutUrl.ts` (antes `stripeCheckoutUrl.ts`),
`src/app/(public)/reservar/pago/page.tsx`,
`src/components/public/PublicPaymentStatus.tsx`,
`src/features/huesped/pages/CuentaHuespedConectada.tsx`,
`src/i18n/operationalLabels.ts` y las pruebas BFF de contrato público, disparo y
estado del pago; nuevas pruebas Recurrente BFF/E2E; presentación del borrador,
consumidor/generación del contrato y resultados E2E.

## Criterios de aceptación

1. Redirección: implementada y comprobada técnicamente con `urlPago`, destino
   restringido e importe del servidor. Falta validar una URL y checkout Sandbox
   reales, GTQ e importe en el proveedor.
2. Retorno: implementado y comprobado con respuestas controladas para estados y
   errores. Falta el recorrido real con webhook firmado y conciliación del API.
3. Limpieza: retiradas las referencias activas Stripe del checkout público y su
   adaptación BFF. Las restantes corresponden a compatibilidad histórica o al
   archivo demo persistido. No se eliminaron registros ni formatos anteriores.

No se han ejecutado Actions remotos ni se ha publicado esta rama.

## Dependencias concretas del backend

### Estado histórico sin evidencia de proveedor

`GET /api/v1/publico/reservas/{codigo}/estado` consulta solamente pagos
RECURRENTE en la implementación inspeccionada. Un pago Stripe histórico puede
devolver `estadoPago: null`. Esto no demuestra ausencia de pago. El frontend
conserva la reserva confirmada sin afirmar aprobación ni importe de ese pago;
no permite cobrar un intento Stripe conocido ni un pendiente nulo sin contexto
local Recurrente. El equipo API debe definir evidencia autorizada suficiente
para distinguir ausencia de pago de historial legado antes de habilitar esos
reintentos. No se propone un campo inventado ni se modifica el contrato aquí.

### Checkout abierto frente a pago en procesamiento

El mismo GET devuelve `PENDIENTE` para situaciones que el cliente no puede
distinguir. `puedeReintentar` no basta para decidir que puede generarse otro
cobro. El frontend ofrece consultar, sin POST. Para reabrir con seguridad una
sesión abierta, el equipo API debe precisar el contrato de estado/reanudación y
el comportamiento de `POST /api/v1/publico/reservas/{codigo}/pago` ante ambos
casos. Actualmente un pago en proceso puede responder `409 PAGO_EN_VERIFICACION`.

### Intento sin código de reserva (fuera del alcance)

Si se perdió la respuesta de creación y sólo existe la identidad idempotente,
no hay un contrato de consulta de resultado por esa identidad para implementar
la recuperación solicitada anteriormente. Se conserva la protección existente;
no se descarta el comprobante ni se supone fallo. El equipo API debe publicar
su mecanismo antes de desarrollar esa recuperación. No se crea otro endpoint.

## Requisitos de prueba real pendientes

- API activo con la implementación integrada y credenciales Recurrente de
  prueba exclusivamente en el servidor; URLs públicas de retorno correctas.
- Checkout real que permita comprobar el host/ruta devueltos, GTQ y monto.
- Webhook público con encabezados Svix, firma y conciliación verificadas por API.
- Probar éxito, cancelación, vencimiento y demora de webhook, retornos, recarga,
  concurrencia y ausencia de duplicados con registros de prueba autorizados.
- Verificar el saldo compartido con el checkout real; las pruebas locales de
  este cambio no acreditan cuenta/check-out/factura ni recepción de correo.

La Issue #61 no se declara terminada de extremo a extremo hasta completar esa
evidencia. No se han realizado cobros, envíos de correo ni reservas reales.
