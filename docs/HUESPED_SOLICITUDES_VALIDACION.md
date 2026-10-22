# Solicitudes del huésped — contrato oficial

Fuente: HU-HUE-12/13/14 y OpenAPI de docs 77225a1. Integra GET reservas/{codigo}/solicitudes, POST solicitudes/limpieza, POST solicitudes/articulos y POST solicitudes/{id}/cancelar bajo /api/v1/app. Los DTO ya existen en los tipos de develop; no se modifica la PR #76.

## Frontend implementado
- Mis solicitudes muestra tipo, fecha de Guatemala, estado, comentario y artículos/cantidades. Carga al abrir, botón de actualización y gesto desde arriba; un error de consulta no se presenta como historial vacío confirmado.
- Cancelación con confirmación y bloqueo de doble envío, solamente para PENDIENTE. La respuesta debe confirmar CANCELADA; 409 mantiene el mensaje del servidor.
- Limpieza usa la ruta oficial y comentario opcional de hasta 500 caracteres. Conserva el bloqueo de solicitud activa y añade cierre inmediato contra doble envío.
- Artículos envía únicamente SolicitarArticulosPeticion: articulos con articuloId/cantidad. No envía clave ni comentario fuera de contrato. El comentario del formulario se conserva deshabilitado para huésped, con explicación; el formulario de Recepción conserva su flujo existente.
- Se conserva un comprobante local de intento de artículos. El contrato no define idempotencia ni consulta por identificador de ese intento: tras un envío incierto no se repite automáticamente ni se habilita otro desde el formulario; se ofrece consultar Mis solicitudes. No se fabrica una equivalencia por comparar texto/cantidades.
- BFF permite solo las rutas/métodos nuevos documentados, valida los artículos, mantiene Origin, cookies httpOnly, renovación de sesión, propiedad definitiva en el API y errores del servidor. Conserva rutas anteriores para consumidores existentes.

## Pruebas
- 182 componentes de la suite completa: pasan, incluidos 6 casos nuevos.
- 149 pruebas BFF: pasan, incluidas rutas oficiales, DTO, errores, Origin, sesión e historial.
- 3 recorridos Chromium en 1440/390/320: pasan con HTTP e identidad aislados; lista, cancelación y recarga. Sin pageerror ni desbordamiento horizontal.
- TypeScript, i18n y build: pasan. Lint sin errores; conserva el aviso preexistente de imagen del hero.

## VALIDACIONES FUTURAS CON BACKEND
- Persistencia de solicitudes y cancelación, 409 por estados/concurrencia y propiedad entre cuentas, con API actualizado.
- Confirmar operativa de los endpoints oficiales con permisos reales. No se ejecutaron guardados de producción.
- Si se desea reintentar un alta de artículos cuyo resultado fue incierto, hace falta un mecanismo contractual de idempotencia/recuperación. El frontend no lo inventa ni elimina el comprobante por tiempo.

Las pruebas de esta fase son controladas; no se crearon cuentas, solicitudes, reservas o pagos reales. No se modifica backend, base de datos ni documentación oficial.
