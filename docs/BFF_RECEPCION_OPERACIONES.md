# Búsqueda, cancelación y habitaciones — Issue 8

Las pantallas existentes consultan el BFF de Next.js. Funciona con datos de prueba;
no se conecta a Spring ni solicita devoluciones a Stripe. El contrato `openapi.yaml`
permanece sin cambios. Las reglas usadas son HU-REC-05, HU-REC-06, HU-REC-07,
HU-REC-10 y HU-REC-11 de las fuentes enlazadas en el Issue.

## Rutas y reglas

El navegador usa `/api`; su equivalente del contrato empieza por `/api/v1`.

| BFF | Operación |
| --- | --- |
| `GET /api/reservas` | Texto (nombre/documento), código exacto, fechas con traslape, estado, canal, llegan/salen hoy y paginación. |
| `GET /api/reservas/{codigo}` | Detalle, huéspedes, canal, identificador externo e historial de estados. |
| `GET /api/reservas/{codigo}/cancelacion` | Vista previa de reembolso calculada en servidor. |
| `POST /api/reservas/{codigo}/cancelar` | Motivo obligatorio de hasta 500 caracteres; solo confirmadas y fuera de Booking/Expedia. |
| `PUT /api/reservas/{codigo}/habitacion` | Solo pendiente de pago/confirmada; mismo tipo, sin traslape ni fuera de servicio. Puede estar sucia. |
| `GET /api/habitaciones` | Ocupación y condición independientes; filtros por ambas, tipo y piso; indicadores e incidencia bloqueante de solo lectura. |
| `GET /api/habitaciones/disponibles` | Opciones para el tipo y las fechas del contrato. |
| `POST /api/habitaciones/{id}/marcar-sucia` | Sin cuerpo; únicamente libre y limpia, sin cambiar ocupación. |

Todas requieren sesión de Recepción y contraseña temporal cambiada. Las escrituras
validan Origin. Otros roles reciben 403; el menú por sí solo no concede permisos.
La lectura y las respuestas usan `no-store`; no se entregan tokens al navegador.
El modo conectado falla explícitamente sin recurrir a datos de prueba.

El reembolso total simulado exige pago con tarjeta y al menos 48 horas antes de las
15:00 de llegada en Guatemala. Se prueban `REEMBOLSO_TOTAL`, `SIN_REEMBOLSO` y
`SIN_PAGOS`. Un rechazo de reembolso deja intacta la reserva. La cancelación cierra
su cuenta de prueba, libera la asignación y registra motivo, responsable y fecha.
Una repetición no cancela ni reembolsa otra vez. No se envía dinero ni correo real.

## Datos de prueba y pantallas existentes

Se adaptan huéspedes, habitaciones y reservas existentes a los identificadores y
códigos del contrato (`VS-TEST01` a `VS-TEST08`). Se agregan variantes del mismo
huésped para probar pagos, rechazo de reembolso y canales. `VS-PAGO01` tiene pago
y llegada a más de 48 horas; `VS-PAGO02` llega hoy; `VS-PAGO03` rechaza el reembolso;
`VS-CANA01` y `VS-CANA02` son Booking y Expedia.

El archivo del servidor es `.data/reception-demo.json`, configurable únicamente
en servidor con `VILLA_SERENA_RECEPTION_DEMO_PATH`. Las escrituras usan bloqueo y
reemplazo atómico; almacenamiento corrupto u ocupado produce un error explícito.
Los cambios de asignación y condición quedan en la auditoría del servidor; el
historial de estados conserva el formato de `HistorialEstado` del contrato.

Los accesos a cuenta/check-in/check-out reutilizan las pantallas locales existentes
mediante una copia de compatibilidad, conservando perfiles y otras reservas.
No se presentan esas acciones locales como operaciones ejecutadas por el BFF.
Desde ese acceso no se ofrece la cancelación ni la asignación local que podría
evadir las reglas del servidor. Su integración completa pertenece a sus tareas.

## Base y comprobaciones

La rama se recompuso sobre `develop` en `9ff08df`, donde ya está integrado #22 con
la sesión del personal y la reserva pública. #19 y #21 seguían abiertos al revisar,
pero su funcionalidad necesaria ya está en esa base: no se duplican sus commits.
Los cambios propios de esta rama corresponden únicamente a #8.

Pruebas del servidor/BFF: filtros, contrato, historial, permisos, Origin, límite
exacto de 48 horas, cancelación, rechazo atómico, repetición, asignación y condición.
La suite `tests/e2e/reception-operations.spec.ts` comprueba computadora
(1440 px) y móvil (390 px), incluidas entradas inválidas sin búsqueda, acciones,
reservas de canal, cancelaciones, asignación y filtros de habitaciones.
Playwright administra Next y restaura datos demo aislados antes de cada caso:

```powershell
pnpm exec playwright test tests/e2e/reception-operations.spec.ts
```

## Pendiente

- Conectar y validar Spring y la actualización entre todos los módulos existentes.
- Comprobar con Stripe de prueba la devolución de una reserva pagada cancelada con
  48 horas o más. No se ha realizado esa prueba ni una devolución real.
- Comprobar una factura emitida antes de ofrecer impresión: `ReservaDetalle` de
  `GET /api/v1/reservas/{codigo}` no incluye identificador ni estado de factura.
  No se interpreta `FINALIZADA` como prueba de factura emitida ni se inventan campos.
- Actualización en tiempo real: esta etapa consulta al abrir y mediante Actualizar.

Las reglas de cancelación y “Marcar sucia” coinciden entre fuentes y contrato.
