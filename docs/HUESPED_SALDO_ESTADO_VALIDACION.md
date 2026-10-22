# Pago de saldo — consulta contractual

Fuente: ProcesoPago y GET app/reservas/{codigo}/pago-saldo/estado de docs 77225a1. El adaptador usa los campos existentes de RecurrenteStatus; es compatible con la adopción generada pendiente en #76, sin editar schema.d.ts ni duplicar OpenAPI.

- BFF: permite únicamente el GET oficial de estado, manteniendo cookies httpOnly, renovación, Origin para escrituras, permisos/propiedad del API y Cache-Control no-store. No añade un endpoint de Spring.
- Cuenta del huésped consulta el estado al abrir, permite consulta manual y vuelve a comprobarlo antes de iniciar cualquier cobro.
- CONTINUAR reutiliza urlPago sin POST. INICIAR y REINTENTAR utilizan el POST existente solo cuando una consulta reciente lo autoriza. ESPERAR, NO_VERIFICADO y respuestas inválidas no permiten cobrar.
- El destino pasa por checkoutUrl, que conserva HTTPS y el host/ruta autorizados de Recurrente. GTQ y las reglas del servidor permanecen intactos.
- Doble clic comparte un solo intento en curso. Error de conexión o resultado desconocido no se interpreta como rechazo ni éxito; obliga a consultar. Nunca se confirma por parámetros de URL.
- PAGADO observado en el proveedor con estado contable pendiente sigue mostrando procesamiento. Solo APROBADO/REEMBOLSADO del registro local se describe como registrado. Un 204 actualiza la cuenta, sin inventar un pago exitoso.
- No se modifican pagos históricos, facturas ni la confirmación del check-out. Los nuevos cargos se rigen por la acción actual del API.

## Comprobaciones

11 pruebas de componentes y 7 del BFF/acceso de huéspedes: pasan. TypeScript, lint dirigido sin avisos nuevos, i18n y build: pasan. Pruebas con respuestas controladas, sin pagos, cuentas o reservas reales.

## Validaciones futuras con backend

Estado entre sesiones y retornos reales, propiedad de reserva, ventana de salida, pedidos EN_CAMINO, nuevos cargos tras un pago aprobado y Recurrente Sandbox. No se ejecutaron cobros reales ni se afirma integración completa.
