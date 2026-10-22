# #67: contrato canónico y hora estimada de llegada

Contrato adoptado: docs `77225a11d06daf576a404e2a557185868bd49c56`.
Tipos generados por las herramientas de ese checkout limpio; no se copia el YAML
al repositorio web. CI obtiene el mismo SHA desde `api-contract.json`.

## Implementación

- Reserva pública por tipo y oferta: envía `horaEstimadaLlegada` cuando se indica,
  en HH:mm local de Guatemala. Vacía se omite; sin segundos, UTC o valor por defecto.
- La hora participa en la huella idempotente. Una solicitud incierta conserva su
  identidad y no se reemplaza por otra creación ni por otro cobro.
- Detalle autorizado de Recepción: muestra la hora recibida; null o ausencia
  histórica muestra «No indicada». La copia local de compatibilidad conserva el
  valor recibido, sin inventarlo.
- Los enums de Recurrente usan los tipos oficiales. Se conserva la lectura
  defensiva de respuestas anteriores y el bloqueo de cobros con estado incierto.
- Las fixtures históricas de Recepción declaran null; no se cambian reglas de
  pago, cookies, verificación de correo, permisos o check-in.

## Comprobaciones locales

- Generación canónica y comprobación sin sobrescribir: pasan.
- Consumidor del contrato: 5/5, incluyendo rechazo de checkout modificado y
  archivo generado alterado. La prueba de clonación se ejecutó fuera del sandbox
  tras detectar su bloqueo de propiedad de carpetas de Windows.
- Unitarias/componentes seleccionados: 34 pruebas distintas aprobadas. Cubren
  hora opcional, límites 00:00/23:59, formatos inválidos, revisión/edición,
  valor/null/ausencia en detalle, doble clic e idempotencia, y estados Recurrente.
- BFF seleccionado: 21/21. Incluye ambas rutas públicas, omisión/null/HH:mm,
  comprobante de correo, clave original, conflicto 409 y recuperación sin POST.
- TypeScript, comprobación i18n y compilación: pasan.
- Lint de archivos modificados: sin errores; conserva avisos en las pantallas
  anteriores de Recepción (hooks, imágenes y símbolos sin uso).
- `git diff --check`: pasa.

Las pruebas usan mocks/fixtures aislados. No se crearon reservas, pagos ni datos
reales; no acreditan persistencia en Spring ni un recorrido conectado en Sandbox.

## Límite del contrato y validación pendiente

`ReservaRecepcionPeticion` no incluye `horaEstimadaLlegada`. Por eso no se envía
en `POST /api/v1/reservas`, ni se inventa una operación para editarla. Para admitir
el alta desde Recepción, el contrato oficial debe definir esa entrada y su regla
de validación/idempotencia. El soporte público y la lectura autorizada sí están
documentados y conectados en esta entrega.

Queda comprobar con una sesión autorizada que Spring guarda una reserva pública
por tipo/oferta con y sin hora y la devuelve a Recepción. No se declara resuelta
la ampliación del alta de Recepción ni se cierra automáticamente la issue.
