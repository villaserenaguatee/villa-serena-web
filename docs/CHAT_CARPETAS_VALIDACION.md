# Chat: carpetas independientes del transporte

El listado de Recepción se filtraba siempre por la respuesta de chat-preferencias. Un 404, una desconexión o una respuesta inválida dejaban una lista vacía aunque las reservas y sus mensajes estuvieran autorizados y disponibles.

La lista usa las reservas autorizadas cuando las carpetas no están disponibles. Favoritos, archivado, no leídos y eliminación permanecen deshabilitados en ese estado, con aviso sencillo. Cuando el servicio existente responde correctamente, se conservan las preferencias, sus acciones y el acuse de lectura. No se guardan preferencias locales ni se fabrican respuestas exitosas. Las consultas abortadas no sustituyen la conversación actual.

No se altera EstanciaChat ni sus rutas, propiedad de mensajes, permisos, idempotencia o bloqueo de envío al terminar la estancia. No se agregan endpoints. El OpenAPI oficial de docs 77225a1 no define chat ni preferencias; se conserva el transporte ya implementado, y su formalización contractual y validación con Spring siguen pendientes.

## Pruebas locales

- 6 componentes: 404, respuesta inválida, acciones reales disponibles, fallo de guardado, acuse de lectura y transporte existente de Huésped/Recepción.
- 3 recorridos Chromium a 1440, 390 y 320 px: conversación accesible con 404 de carpetas, opciones deshabilitadas, historial y selección conservados tras recarga, sin solicitudes de escritura ni pageerror/desbordamiento horizontal.
- TypeScript, lint dirigido, i18n y build: pasan. El build conserva avisos previos ajenos a estos archivos.
- Respuestas e identidad aisladas de prueba; no se acredita sesión real, sincronización entre usuarios ni persistencia del backend. No hubo correos, pagos o escrituras de producción.

El primer arranque del navegador quedó afectado por ENOSPC al generar la caché. Se eliminó únicamente la salida generada de este worktree y se repitió desde un arranque limpio: los tres casos pasaron. Capturas y logs quedan fuera de Git.
