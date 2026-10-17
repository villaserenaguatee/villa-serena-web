# Documentos del check-in: diagnóstico y contrato que falta

## Resultado de la revisión

El backend actual NO permite subir, asociar ni consultar documentos de identidad de una reserva. No se puede implementar persistencia entre navegadores únicamente en el frontend. No se inició el backend ni se utilizó el enlace vencido. No se modificó el API.

Evidencia revisada en `C:/Users/Ofit/villa-serena-api`:

- `openapi.yaml`, operación `/api/v1/archivos/imagenes`: excluye expresamente PDF y documentos de identidad. HUESPED no tiene permiso de subida.
- `archivos/ArchivosController.java`: autoriza RECEPCION y MANTENIMIENTO_LIMPIEZA.
- `archivos/UsoImagen.java`: HOTEL, TIPO_HABITACION, MENU, AMENIDAD, INCIDENCIA; no existe uso para identidad.
- `archivos/ImagenesService.java`: únicamente admite INCIDENCIA y guarda bajo `incidencias/`; devuelve 403 para otros usos. No sirve para documentos de huéspedes.
- `app/AppReservasController.java` y `app/dto/ReservaAppDetalle.java`: acceso HUESPED a sus reservas, sin operaciones ni campos para archivos del check-in.
- `reservas/RecepcionReservasController.java` y `reservas/dto/ReservaDetalle.java`: detalle para RECEPCION sin documentos; check-in es una acción POST sin cuerpo.
- `estadia/CheckinService.java`: cambia ocupación/estado tras validar reserva, fecha y habitación; no recibe ni guarda documentos.
- Migraciones en `src/main/resources/db`: datos de identidad textuales del huésped, sin persistencia de adjuntos del check-in ni relación de archivos por reserva/lado.

La infraestructura `AlmacenArchivos` tiene almacenamiento privado y URLs firmadas, pero eso por sí solo no aporta autorización del huésped, vinculación a reserva ni consulta de identidad. No se reutilizó el flujo de incidencias.

## Recorrido real del frontend

1. `CheckInWeb.tsx`: FileReader convierte JPG/PNG/PDF a data URLs. No hay petición HTTP de subida. DPI requiere frente y reverso; el pasaporte actualmente tiene un único adjunto (`unico`). Por tanto, el formulario todavía no cumple dos caras para pasaporte.
2. `HuespedApp.tsx`, `completarCheckIn`: busca la reserva por ID y huésped y copia los adjuntos a `reserva.checkInWeb`.
3. `reservationStore.ts`: `upsertReserva`/`guardarReservas` guardan el JSON en localStorage. Una recarga puede conservar los archivos en ese mismo navegador y origen, sujeto a cuota y conservación del almacenamiento. Otro navegador no comparte estos datos.
4. `ReceptionDetailBff.tsx`: en modo conectado descarta `localCheckIn`; en modo local busca la reserva por código/codigoBff y comprueba documento y tipo del huésped antes de mostrar sus archivos.
5. `DocumentosCheckIn.tsx`: el visor consume `previewUrl` local; mantiene miniaturas, navegación, zoom, arrastre y cierre. No consulta ni renueva archivos remotos.

Se conservaron datos, campos, adjuntos y visor. Solo se corrigieron mensajes que afirmaban envío/recepción remota: ahora indican guardado local y falta de consulta desde otro navegador. No se añadieron endpoints ni una subida ficticia.

## Lo que debe aportar el backend

Las siguientes son capacidades requeridas, NO rutas existentes ni rutas implementadas. El equipo del API debe definirlas y publicarlas en OpenAPI antes de conectar el frontend.

1. **Subida dedicada de documentos por reserva.** Multipart autenticado como HUESPED, validando en servidor que la reserva pertenece al usuario y permite adjuntos. Debe recibir tipo de documento y lado, y devolver un ID de archivo persistido. Para el recorrido solicitado deben contemplarse frente y reverso tanto del DPI como del pasaporte; el contrato debe precisar qué páginas del pasaporte corresponden a cada lado. Nunca usar el código de reserva como autorización.
2. **Persistencia privada y relación estable.** Guardar el contenido en almacenamiento privado, separado del uso INCIDENCIA; guardar en base de datos ID, reserva_id, huésped_id, tipo, lado, nombre, MIME real, tamaño, clave privada, fecha y versión/estado. La consulta debe filtrar por reserva autorizada en el servidor; no aceptar una clave arbitraria enviada por el navegador para leer archivos.
3. **Consulta de adjuntos por reserva.** HUESPED puede consultar únicamente sus reservas; RECEPCION puede consultar los documentos de la reserva atendida según la política del hotel. Otros roles no reciben acceso por tener permiso sobre fotos de incidencias. La respuesta debe incluir metadatos y ambos lados, ordenados, sin adjuntos de otras reservas.
4. **Lectura protegida del contenido.** Entregar bytes tras autorización o generar una URL firmada de corta duración después de comprobar usuario, reserva y archivo. Definir vencimiento y mecanismo de nueva consulta/renovación para que recargar o abrir otro navegador autorizado funcione incluso cuando una URL anterior haya caducado. No exponer rutas públicas permanentes.
5. **Confirmación del envío de documentación.** Guardar el conjunto enviado, aceptación de términos y su fecha; comprobar que están los lados obligatorios. No marcarlo recibido antes de persistirlos. La documentación enviada y el check-in que activa la estancia deben ser estados distintos. Si se conserva aprobación/rechazo/reenvío del formulario, hacen falta operaciones y permisos RECEPCION para esa revisión y consulta del estado/motivo por el huésped.
6. **Validación y consistencia.** Acordar JPG/PNG/PDF y límite de 5 MiB por archivo, coherentes con el formulario; validar contenido real. Definir duplicados, sustitución por lado, versionado y reintentos/idempotencia para no intercambiar caras, duplicar envíos ni perder documentos ante fallos parciales. Definir retención/eliminación de los documentos privados y auditoría de acceso.
7. **Contrato y pruebas.** Publicar operaciones, esquemas, permisos, estados y errores 400/401/403/404/409/413 y fallos de almacenamiento. Incluir en el detalle de reserva referencias al conjunto o una consulta específica; los DTO actuales no las tienen. Añadir pruebas de pertenencia y separación entre reservas.

Con ese contrato el frontend podrá conservar el diseño aprobado: subir cada archivo por el BFF con la sesión del huésped, guardar referencias remotas, consultar el conjunto de la reserva con la sesión de Recepción y alimentar el visor con contenido autorizado. El pasaporte necesitará el segundo campo previsto en el recorrido solicitado.

## Validación con API activo

- Primero comprobar que estas capacidades existen en la versión desplegada. Un enlace activo al backend actual no elimina la falta de soporte.
- Huésped A adjunta ambos lados y confirma envío; recargar y volver a iniciar sesión conserva los mismos documentos.
- Recepción abre la misma reserva desde un segundo navegador sin localStorage compartido y ve ambos archivos con el visor aprobado.
- Usar dos reservas del mismo huésped y una de otro huésped: archivos diferentes por reserva/lado, sin filtraciones al cambiar código/ID; acceso ajeno denegado.
- Caducar la URL de lectura y volver a consultar: obtener contenido autorizado nuevo, sin depender del enlace anterior.
- Comprobar cierre/renovación de sesión, permisos de otros roles, MIME real, tamaño, PDF si se admite, sustitución de caras, envíos duplicados, timeout y fallos parciales.
- Verificar que no se muestra “enviado” ante fallo y que ningún error se sustituye por adjuntos locales o demo.
- Validar pasaporte con frente y reverso una vez definido el contrato; el formulario actual solo permite una página.

## Comprobaciones locales

- `node scripts/test-checkin-documentos.cjs`: pasa; comprueba miniaturas/visor, navegación, zoom, arrastre, cierre y conservación mediante JSON. Es una prueba local, no acredita subida ni persistencia remota.
- `node scripts/test-portal-checkin.cjs`: falla porque su harness extrae `validarCheckInWeb` sin incluir `checkedCheckIn` (`ReferenceError`). No es una prueba con API activo.
- TypeScript e i18n: correctos para los cambios de textos.
