# Categorías y catálogo público

La categoría guarda nombre, descripción, capacidad, precio base, ajuste de viernes y sábado y estado mediante `POST /api/v1/admin/catalogos/tipos`. El identificador y la versión existentes se conservan. Crear o editar una categoría no crea, guarda ni publica una oferta.

El acceso «Administrar catálogo» de cada categoría abre una gestión independiente. No se muestran campos desconectados en el formulario básico.

## Operaciones disponibles y conectadas

| Función | Operación canónica |
|---|---|
| Consultar fotografías de categoría | `GET /api/v1/admin/tipos-habitacion` |
| Subir imagen de categoría | `POST /api/v1/archivos/imagenes`, uso `TIPO_HABITACION` |
| Asociar, reemplazar, ordenar y elegir principal | `PUT /api/v1/admin/tipos-habitacion/{id}/fotos` |
| Consultar características reales de una habitación | `GET /api/v1/admin/habitaciones/{id}/caracteristicas` |
| Guardar capacidad, superficie, camas y servicios | `PUT /api/v1/admin/habitaciones/{id}/caracteristicas` |
| Consultar ofertas administrativas | `GET /api/v1/admin/ofertas` |
| Crear oferta sin publicar | `POST /api/v1/admin/ofertas/{slug}`, `publicada:false` |
| Editar oferta y sus vínculos | `PUT /api/v1/admin/ofertas/{slug}` |
| Publicar o despublicar explícitamente | `PATCH /api/v1/admin/ofertas/{slug}/publicacion` |

Las operaciones ya existen en el contrato fijado en `api-contract.json` y en el API integrado. El bloqueo era el componente web antiguo, no la ausencia de endpoints. No se necesita PR del API ni cambio del contrato para este alcance. Se conservan los tipos generados.

## Reglas conservadas

- El BFF exige ADMIN y verifica el origen de las escrituras; los tokens permanecen en cookies httpOnly.
- Superficie, camas y servicios pertenecen a cada habitación física. Un registro vacío no recibe valores inventados. El API rechaza cambios comprometidos en reservas activas.
- Las ofertas vinculan IDs reales de habitaciones. El API verifica tipo, piso, capacidad y características; para publicar exige categoría activa, galería y habitaciones acreditadas.
- El precio público de la oferta es independiente del precio base de la categoría. No hay cupos manuales.
- La galería pertenece a la categoría, no a cada oferta. Se conserva completa salvo cambio explícito; exige al menos una imagen y exactamente una principal. No se llama a un borrado físico.
- Guardar una oferta nueva no la publica. Publicar y despublicar requieren confirmación y su PATCH independiente.
- Este contrato no ofrece borradores editoriales para ofertas: editar una oferta que ya está publicada actualiza su contenido público al guardar; guardar fotografías cambia la galería compartida de las ofertas de esa categoría. Estas son operaciones separadas del guardado básico de categoría, no el editor de borradores del hotel.
- Una respuesta fallida o sin confirmación no se presenta como éxito y mantiene la edición para corregirla. No se repiten automáticamente escrituras.

## Dependencia y validación

La PR web parte de la limpieza visual #114: conserva textos retirados, mapa, pestañas y filtros. Integrar primero #114 y actualizar esta base a `main`, verificando diff y CI antes de integrar. Ninguna integración o publicación está autorizada en este trabajo.

Las pruebas web usan respuestas del contrato y archivos de prueba locales, no producción. Incluyen categorías, ofertas, fotografías, recuperación, rechazo por reservas activas, validaciones y permisos.

La ejecución local adicional de `OfertasAdminIntegrationTest` y `TiposHabitacionAdminIntegrationTest` no pudo iniciar sus 19 casos: Testcontainers no encontró Docker disponible. No es una validación aprobada del API ni se sustituyó por una conexión a producción. Su repetición requiere Docker local operativo. No se modificó el código del API.
