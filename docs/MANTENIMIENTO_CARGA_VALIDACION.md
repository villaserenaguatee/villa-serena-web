# Mantenimiento: carga independiente

HU-MYL-06/07/08 de docs 77225a1 respaldan reportar, tomar y resolver incidencias. El módulo existente agrupaba su consulta con activos, preventivos, órdenes e insumos en un Promise.all: un fallo de cualquiera descartaba el resultado de incidencias y ocultaba el panel.

Se separan las consultas oficiales de las adicionales. Si estas últimas no están disponibles, Inicio conserva el componente existente de incidencias; no habilita crear órdenes ni formularios de recursos sin datos cargados. Cuando responden correctamente, el panel, activos, preventivos y órdenes conservan su funcionamiento. Los errores de incidencias se muestran; no se sustituyen por datos de demostración. Las acciones existentes conservan sus validaciones, permisos e identificadores de intento. No se agregan endpoints ni se modifica el API.

## Validación local

- 4 componentes: independencia de incidencias, error real, operaciones existentes disponibles y recuperación mediante actualización.
- 4 recorridos Chromium: escritorio y móvil, tomar/resolver por técnico autorizado y fallo de operaciones adicionales sin bloquear el flujo oficial. Sin desbordamiento ni pageerror.
- TypeScript, lint dirigido e i18n pasan. Compilación de producción comprobada por separado.
- Identidad, HTTP y estados del servidor son de pruebas aisladas; no prueban persistencia o acceso real a Spring. No se ejecutaron reservas, pagos, correos ni escrituras de producción.

La ruta gestion/insumos forma parte del OpenAPI 77225a1 como inventario compartido. Las rutas gestion/activos, gestion/preventivos y gestion/ordenes no forman parte de esa revisión. Se conserva su integración existente sin extenderla ni presentar su disponibilidad como garantizada. La verificación con API compatible y sesión de técnico autorizada sigue pendiente. No se modifican los flujos de Limpieza o Room Service ya cubiertos por CI.
