# Administración: catálogos oficiales

Fuente: historias HU-ADM-02 a HU-ADM-08 y OpenAPI de docs 77225a11d06daf576a404e2a557185868bd49c56. No se modifica el contrato fijado ni la PR #76; los DTO utilizados ya existen en los tipos de develop.

## Implementado
- Menú administrativo separado de Room Service: categorías POST/PATCH; productos POST/PATCH, cambio de estado y reactivación mediante las operaciones oficiales.
- Temporadas GET/POST/PUT/DELETE, categorías asociadas editables, validación de fechas y ajuste mayor a -100. El servidor decide los conflictos.
- Hotel GET/PUT: datos generales y fiscales, validación de correo y NIT; horas y política de cancelación de solo lectura. No se intenta crear una configuración ausente.
- Fotografías JPG/PNG hasta 5 MiB: selección, vista previa local, reemplazo, quitar asociación y principal de categoría. Subida con uso oficial, claves y orden; sin inventar URLs ni borrar objetos del servidor. La asociación solo confirma éxito con respuesta válida.
- Controles separados de oferta, precio público y publicación; una categoría activa no equivale a una oferta publicada.

## Comprobado localmente
- Suite completa de componentes: 189/189.
- BFF: 2 pruebas nuevas de fotografías y operaciones ADMIN; 3 regresiones existentes de incidencias. Pasan.
- Navegador Chromium: 3 recorridos a 1440, 390 y 320 px, formularios, validación, cancelar, conflicto y conservación de entradas. Sin desbordamiento horizontal ni pageerror. Capturas locales revisadas, no versionadas.
- TypeScript, lint dirigido e i18n pasan. Build de producción pasa; mantiene avisos preexistentes de otros archivos, sin errores.

Las respuestas y la identidad del navegador son aisladas y simuladas. No hubo cuentas, fotografías, cambios de hotel ni guardados en Spring/PostgreSQL. No acreditan persistencia real.

## Dependencias
- API #58/#82/#83/#84: confirmar soporte desplegado y compatibilidad de categorías/habitaciones y catálogo. El contrato no define escrituras administrativas de ofertas, superficie, camas o características; sus controles permanecen deshabilitados.
- Hotel no configurado: el API debe proporcionar la configuración inicial antes del PUT. No se inventa un alta ni se asignan datos por defecto.
- HotelAdmin y ItemMenuAdmin no proporcionan URL histórica de fotografía. Se muestra su existencia y se permite reemplazar/quitar según DTO; no se fabrica una URL.
- Precio base de categoría y precio de oferta siguen siendo fuentes diferentes: no se propagan cambios sin operación oficial.
- Validación real con sesión ADMIN autorizada y servidor compatible pendiente. No se ejecutan escrituras de producción.
- PR independientes de Personal, supervisión e indicadores pueden coincidir en navegación compartida; conservar sus entradas al integrarlas. No se fusiona ninguna automáticamente.
