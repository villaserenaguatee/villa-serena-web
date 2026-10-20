# Resultado del pago (#33)

Se conserva el contrato de `src/lib/api/schema.d.ts`: el estado público solo contiene código, estados y `puedeReintentar`, sin datos personales. La página consulta el BFF y no confirma por parámetros o navegación.

El apartado «Aviso de Stripe (webhook)», ruta `POST /api/v1/pagos/stripe/webhook` (HU-HUE-06 · RF-PAG-004), define `checkout.session.expired` como pago `FALLIDO`. No define un rechazo bancario ni proporciona un campo con su motivo. Por eso se explica el vencimiento del intento; no se atribuye a un banco. La reserva solo se presenta cancelada cuando el BFF devuelve `CANCELADA`. El apartado «Estado de la reserva al volver de Stripe» atribuye esa cancelación al plazo de 30 minutos.

La consulta manual muestra «Consultando…» y «Estado actualizado.». Terminar el minuto automático no cambia un estado pendiente. Antes de reintentar se consulta otra vez el estado y se utiliza el código de la misma reserva, únicamente si sigue pendiente y `puedeReintentar` lo permite.

Comprobaciones con datos de prueba: VS-DEMO01 a VS-DEMO04 en computadora y móvil, consulta manual, minuto pendiente y reintento sin crear otra reserva. La prueba adicional de FALLIDO usa una respuesta interceptada con los campos del contrato y no cambia los ejemplos almacenados. Queda pendiente validar los eventos y pagos reales de Stripe. No se incluye el detalle ni el acceso del huésped de #35, ni la pantalla de pago de #32.
