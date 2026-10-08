# Detalle de habitación y reservas (#30)

El contrato vigente del API (`openapi.yaml`, blob
`45da8635278b5bcda47e2295e432b0b33d56598b`) no incluye código de reserva en
`HabitacionEstado` ni un filtro de búsqueda por habitación.

Sí permite localizar la asignación mediante `GET /api/v1/reservas`: el apartado
de búsqueda admite `estado`, `page` y `size`, y `ReservaResumen` incluye
`habitacion.id` y `codigo`. La web consulta su BFF existente `GET /api/reservas`,
recorre todas las páginas de `EN_ESTADIA`, `CONFIRMADA` y `PENDIENTE_PAGO` y
compara el ID exacto con el recibido por `GET /api/habitaciones`.

El panel muestra cada reserva activa asignada con su código y fechas, sin elegir
arbitrariamente si hay varias. «Ver reserva completa» abre el detalle BFF
existente por código. Reservas canceladas, finalizadas o sin habitación no
generan este acceso. Un fallo de consulta muestra el motivo, no afirma que no
haya reservas. No se usan asociaciones del almacenamiento local ni rutas nuevas.

El clic también activa directamente el detalle BFF en Recepción. No depende de
que cambie la URL: cerrar y volver a abrir el mismo código funciona sin recargar.

En esta etapa funciona con datos de prueba. El modo conectado conserva las
acciones de habitaciones y explica que la búsqueda de reservas del API todavía
no está conectada al BFF; no mezcla sus habitaciones reales con reservas demo.
Falta validar esa conexión real. Los endpoints conservan el permiso RECEPCION.
