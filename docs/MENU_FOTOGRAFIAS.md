# Menú administrativo y fotografías

## Diagnóstico y cambios

La Web ya usaba un selector de archivos y POST archivos/imagenes con archivo y uso MENU, seguido de POST/PATCH del producto con fotoClave. El BFF ya exige ADMIN, origen válido, firma JPG/PNG y hasta 5 MiB. No se reprodujo un bloqueo del selector en navegador local: el test abre el diálogo real de archivos al pulsar el área y comprueba vista previa sin cargar antes de Guardar. No se consultaron ni probaron cargas en producción, por lo que no se atribuye un fallo de transporte de producción a una causa no observada.

El defecto demostrado en lectura era que ItemMenuAdmin solo exponía fotoClave y el formulario mostraba un mensaje técnico en lugar de la foto guardada. Docs #68 y API #123 añaden fotoUrl opcional/nullable basada en la URL pública configurada. La Web la consume sin fabricar URLs; mantiene el contrato anterior sin perder claves, pero recuperar la vista previa guardada requiere el API actualizado. No hay nuevas rutas ni migraciones.

MenuProductPhoto reutiliza PhotoPicker y la validación existente sin cambiar otras pantallas. Vista previa local con liberación de object URLs; formatos inválidos o >5 MiB bloquean Guardar. Un error de subida no asocia el producto ni anuncia éxito. La asociación fallida conserva formulario y referencia ya cargada para no duplicar archivos al reintentar. Se valida que la respuesta confirme el ID y fotoClave guardados.

Las tarjetas mantienen nombre/precio, descripción, categoría, disponibilidad y estado, con dos acciones: Editar producto y Activar/Desactivar. La reactivación de agotados queda dentro de Editar producto, solo si corresponde, con confirmación independiente; nunca se confunde disponibilidad con estado. Se conserva la operación real POST reactivar y PATCH estado. Las categorías mantienen POST/PATCH propios.

Al quitar una fotografía se envía cadena vacía según el comportamiento existente del API (null en PATCH conserva la clave); no se elimina el archivo físico. No se cambian pedidos, reservas ni datos existentes.

## Dependencias y validación

Orden propuesto: Docs #68, API #123 compatible, despliegue API únicamente con autorización, y después Web. No se integró ni desplegó ninguna PR. La rama Web tiene deshabilitado el despliegue Vercel.

El contrato está fijado a 4ea4de41b6da29f6856df1341a85a3a4a1c905ed; tipos generados desde ese checkout y check:api reproducible. Docs: contrato, generación y 23 pruebas aprobadas. API: compilación y MenuAdminPhotoTest aprobados localmente; CI 40988172562 aprobado con 476 pruebas, cero fallos/errores y una omitida, incluyendo integración del menú.

Web: 28 pruebas de componentes y 2 del BFF aprobadas; E2E verifica creación/edición, subida y asociación MENU, recuperación tras recargar, activar/desactivar sin alterar AGOTADO, reactivación confirmada, categorías, búsqueda y filtros con datos de prueba. Capturas en 1440/390/320, sin escrituras en producción. La primera ejecución E2E falló por getByLabel del filtro; se usa su rol/nombre accesible sin cambiar el diseño.
