# Editor de la página web — Administración conectada

Configuración del hotel conserva dos apartados: **Editor de la página web** y **Datos y políticas del hotel**. El formulario completo ya no es una tercera opción independiente. Las cinco tarjetas internas conservan los datos y operaciones permitidos; facturación, horarios y documentos no adquieren operaciones inexistentes.

## Contrato y guardado

El contrato canónico se fija en api-contract.json. La inicialización explícita usa POST /api/v1/admin/hotel/inicializacion, solo ADMIN: confirma los nueve datos obligatorios aportados por la persona y no reemplaza una configuración existente. HOTEL_NO_CONFIGURADO no provoca inicialización automática ni datos inventados. La vista previa sigue disponible mientras no haya configuración válida.

GET/PUT /api/v1/admin/hotel conservan los nueve campos requeridos. El guardado toma una lectura actual y conserva valores no modificados. Cambiar datos generales o fiscales no reenvía fotografías ni exige su revisión.

## Galería

POST /api/v1/archivos/imagenes con uso HOTEL admite JPG/PNG decodificables de hasta 5 MiB y 16 millones de píxeles. Las claves retornadas se asocian y ordenan con el PUT oficial. Modificar la galería requiere el ETag vigente mediante If-Match; un conflicto conserva el borrador y permite consultar y elegir la versión actual. Reemplazar o quitar asociaciones no elimina físicamente objetos del almacenamiento. El contrato no define una bandera de fotografía principal del hotel: el orden determina su presentación.

Las URLs utilizadas proceden del contrato público; no se construyen hosts de almacenamiento ni se exponen credenciales. Validar la entrega S3/CDN del entorno de producción antes de afirmar que las fotografías funcionan públicamente. Las pruebas con el adaptador local persistente PostgreSQL no acreditan S3.

## Contenido editorial ES/EN

- GET/PUT /api/v1/admin/hotel/editorial/{idioma}: consultar y guardar borradores persistentes, con revisión.
- POST /api/v1/admin/hotel/editorial/{idioma}/publicacion: publicar explícitamente la revisión confirmada.
- GET /api/v1/publico/hotel/editorial/{idioma}: únicamente la versión publicada.

Guardar borrador no publica. Publicar cambios requiere confirmación y mantiene la versión anterior si la operación falla. Cada idioma conserva su propio estado y revisión. Los conflictos no descartan lo introducido por el administrador.

El editor reutiliza PublicHome y PublicAbout reales; el iframe restringido no ejecuta reservas ni formularios. El panel ofrece campos del elemento seleccionado y sincroniza la vista previa sin auto-guardado. Los 64 identificadores canónicos cubren textos, botones e imágenes editoriales. La operación hotelera, tarifas, habitaciones e inventario continúan en sus módulos de origen.

El correo público no configura el transporte SMTP ni su destinatario. No se generan documentos legales definitivos. Las ampliaciones pendientes de contacto y UX conservan sus issues independientes.

## Verificación de esta entrega

Las evidencias y limitaciones locales están en .local/admin-entrega-20261026, fuera de Git. La comparación estricta de rutas conserva diferencias históricas del API; no debe presentarse como conformidad completa del contrato ni ocultarse mediante cambios del comparador.
