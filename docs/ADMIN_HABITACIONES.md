# Administración de habitaciones: alcance frontend

La sección `/admin` reutiliza `CatalogosAdmin` para categorías y habitaciones
físicas, y `ApprovedRoomMapConnected` para el mapa. No cambia componentes, estilos
ni datos del catálogo público, reservas o pagos.

## Operaciones existentes

- GET/POST `/api/v1/admin/catalogos/tipos`: nombre, descripción, capacidad,
  `precioBase`, ajuste de fin de semana y estado del tipo.
- GET/POST `/api/v1/admin/catalogos/habitaciones`: número, piso, tipo y estado.
- El BFF existente traduce `/api/admin/catalogos/...` a estas rutas y conserva
  la sesión y autorización. Se reutiliza el envoltorio `clave`, `id`, `version`,
  `datos`; no se envían campos de contenido no admitidos por el controlador.
- Las cantidades se calculan desde los registros devueltos, separando total y
  activos. No son cupos para fechas ni valores editables.
- No se interpreta una categoría activa como una oferta publicada. Tampoco se
  presenta editar `precioBase` como una actualización del precio público.

## Dependencias del API

- [API #58](https://github.com/villaserenaguatee/villa-serena-api/issues/58):
  reconciliar el contrato canónico con la implementación. OpenAPI documenta
  `/admin/tipos-habitacion` y `/admin/habitaciones`, con operaciones separadas;
  este controlador existente utiliza `/admin/catalogos/...` y POST para alta
  y edición. No se inventan rutas ni se declara conformidad integral.

- API #82: carga y asociación persistente de principal/galería. El enum
  `TIPO_HABITACION` por sí solo no acredita la implementación. La interfaz deja
  la carga inhabilitada; no sube imágenes ni inventa asociaciones.
- API #83: edición de superficie, camas, características/servicios, ofertas,
  publicación y correspondencias físicas, y coherencia entre
  `room_types.base_price` y `catalog_offers.base_price`. En el API del tipo el
  campo se llama `precioBase`. No se crean rutas ni se modifica el contrato.
- El detalle puede consultar las ofertas públicas actuales para el tipo, pero
  esa consulta es de solo lectura y no sustituye un contrato administrativo.
- Se conserva toda protección del servidor sobre reservas existentes; nunca se
  borra una habitación ni se reasigna su inventario desde almacenamiento local.
- [API #84](https://github.com/villaserenaguatee/villa-serena-api/issues/84):
  gestionar el conflicto por nombre de categoría duplicado y las colisiones SQL
  concurrentes. El rechazo secuencial de número de habitación repetido sí se
  comprobó; no acredita que ese pendiente esté resuelto.

## Validación

Las pruebas de componentes utilizan respuestas aisladas para comprobar cargas,
validaciones y el contenido exacto de las solicitudes. Los recorridos de navegador
con API simulada no acreditan persistencia en PostgreSQL ni integración con el
backend desplegado. Los fallos reales se muestran sin sustituirlos por datos demo.

Comprobaciones repetidas antes de preparar la PR:

- TypeScript (`tsc --noEmit`), i18n, lint y build de Next: aprobados. Lint de los
  archivos propuestos sin errores ni avisos; el lint general conserva avisos en
  otros archivos. No se modifican dependencias ni configuración compartida.
- Suite completa de unitarias/componentes: 275 pruebas aprobadas, incluyendo
  11 de gestión de habitaciones y 3 de validación de catálogos.
- Suite BFF: 148 pruebas aprobadas, sin fallidas ni omitidas. Lint general:
  cero errores y 271 avisos en otros archivos; ninguno en los archivos propuestos.
- Revisión visual de seis vistas en escritorio, 390 y 320 px: 18 capturas locales.
  Los controles pendientes de fotografías, superficie, camas, características y
  publicación permanecen deshabilitados.

### Persistencia real, separada de mocks

El 21 de octubre de 2026 se aprobaron **35 comprobaciones reales** en una copia
temporal del frontend con los mismos componentes, contra API
`652eea19d09875f30671a3a6919be47d040f14e1` y PostgreSQL 17 aislado y descartable.
El recorrido fue navegador → Next/BFF → acceso loopback → Spring → PostgreSQL,
sin sustituir las respuestas del servidor. No se probaron servicios desplegados.

- Login local de ADMIN y RECEPCIÓN mediante el BFF con cookies HttpOnly.
- Una categoría y una habitación creadas y editadas desde los formularios.
  Comparación de campos con PostgreSQL y recuperación tras recargar en escritorio
  y móvil; el contador muestra una habitación física activa.
- Número de habitación duplicado: 409 `HABITACION_EXISTENTE`, sin otro registro;
  el formulario conserva sus valores y muestra el mensaje del servidor.
- Replay de altas y actualizaciones sin duplicados ni otro incremento de versión.
  La misma clave con datos distintos devuelve 409 `BOOKING_REQUEST_CONFLICT`.
- Actualizaciones simultáneas con la misma versión: una aprobada y otra con
  409 `VERSION_CAMBIADA`, tanto para categoría como para habitación.
- Escrituras de RECEPCIÓN: 403; sin sesión: 401. Comprobado en el BFF y
  directamente en Spring, sin desactivar permisos ni validaciones.
- Sin excepciones JavaScript capturadas. Exactamente una categoría, una habitación,
  seis auditorías y seis respuestas de idempotencia al terminar; no se crearon
  reservas, pagos, ofertas, fotografías ni correos.

El primer intento con origen `127.0.0.1` fue rechazado por la protección de origen.
La ejecución aprobada usó `localhost`, coincidente con la configuración temporal,
sin modificar esa protección. Los scripts, capturas, credenciales, configuración
de Docker y registros temporales quedan fuera de la entrega; no se publican
archivos `.local` ni datos de prueba de PostgreSQL.

Estas pruebas validan la gestión básica con la revisión de API indicada. No
completan #58, #82, #83 o #84, no cambian el catálogo público y no acreditan pagos,
reservas ni compatibilidad con otra revisión del servidor.
