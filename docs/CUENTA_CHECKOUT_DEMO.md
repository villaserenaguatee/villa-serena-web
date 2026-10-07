# Cuenta, check-out y factura de demostración — issue #12

Este bloque implementa las pantallas de OBJ-4C con datos de prueba. Está separado de las cuentas y los stores heredados de Recepción: no cambia reservas reales, no cobra, no genera PDF en el servidor y no envía correo. No acredita el cierre completo de la issue #12.

Entra como Recepción, abre «Vista del día» y usa «Cuenta, check-out y factura de demostración». La cuenta de prueba está en `/panel/recepcion/reservas/VS-DEMO-4C/cuenta`.

- Tres noches de Q 600.00 y restaurante de Q 125.00: cargos vigentes Q 1,925.00. Lavandería anulada conserva motivo y responsable y no suma.
- La hora simulada es el 8 de octubre de 2026 a las 10:00 de Guatemala; todos los movimientos de prueba usan ese reloj, no la fecha de la máquina.
- Pago aprobado de Q 1,800.00 y pago fallido de Q 100.00: saldo Q 125.00.
- Agregar cargos requiere estadía y cuenta abierta. Anular requiere motivo y solo se permite en cargos adicionales. No hay abonos ni nuevos descuentos.
- Check-out: método efectivo/tarjeta/otro, referencia opcional, comprador y NIT con verificador o Consumidor Final. Cobra en la simulación un único pago por el saldo exacto; con saldo cero no crea pago.
- Un pedido en camino bloquea. Al confirmar se cancelan los pedidos nuevos/en preparación y las solicitudes pendientes/en proceso. Se cierra la cuenta y la reserva de prueba y se ofrece ver la factura e imprimirla.
- La factura conserva fecha, comprador, cargos vigentes y pagos aprobados; reimprimir no los modifica. Incluye «IVA incluido» y «Factura de demostración — no válida ante la SAT».
- Impresión de ticket de 80 mm (página de 80 × 297 mm con paginación si hace falta) o carta. Solo se imprime la factura; no se imprimen menús ni botones. Fecha y hora se muestran en America/Guatemala.

La demostración se guarda en la clave `vs-demo-cuenta-obj4c` del almacenamiento local de este navegador. Cuenta, pago y factura se guardan juntos; la UI no cambia si falla la escritura. Para empezar otra prueba elimina exclusivamente esa clave desde las herramientas del navegador. La serie DEMO y su único correlativo son del fixture, no un contador fiscal ni persistencia multiusuario.

## Verificación

Con las dependencias instaladas, ejecuta `pnpm test:cuenta`, `pnpm check` y `pnpm build`. El runner usa el loader TypeScript existente y no requiere dependencias nuevas.

Para el recorrido con navegador, arranca `pnpm dev --port 3012` y ejecuta `pnpm test:cuenta:browser`. `ACCOUNT_TEST_URL`, `CHROMIUM_PATH` y `ACCOUNT_TEST_ARTIFACTS` permiten elegir servidor, ejecutable de Chromium y carpeta de evidencia. Por defecto usa Chromium del sistema y escribe capturas y PDF en `/tmp/villa-serena-cuenta`. Los contextos de prueba tienen almacenamiento aislado.

## Integración pendiente

El modo API bloquea explícitamente esta demo. Faltan la sesión del personal y los servicios implementados de cuenta, cargos, anulación, check-out y factura (OBJ-4A/4B). La presencia de esos endpoints en OpenAPI no demuestra que estén disponibles. No hay fallback silencioso a datos de prueba.

Al conectar, el API debe calcular el saldo, autorizar al personal y realizar pago/factura/cierre/cancelaciones en una sola transacción. Sustituir el fixture por las llamadas del BFF aprobadas, conservar el diseño, verificar los errores reales y probar que la reserva del servidor queda FINALIZADA. No marcar ese criterio ni la issue como terminados con estas pruebas demo.
