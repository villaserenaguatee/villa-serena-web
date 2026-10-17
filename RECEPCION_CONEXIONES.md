# Recepción: conexiones y validación pendiente

Trabajo limitado a esta copia de preview. Backend consultado en modo lectura; no se inició ni se utilizó el enlace vencido. No se hicieron commits, push ni PR.

## Conectado con el contrato implementado

- BFF de huéspedes, reservas y habitaciones: sesión del personal, rol RECEPCION, protección de Origin, JWT solo en servidor, estados HTTP del backend y errores explícitos sin fallback demo.
- Disponibilidad y cotización por fechas y número de huéspedes; habitaciones asignables por tipo y rango.
- Registro y búsqueda de huéspedes; consulta paginada de reservas del perfil, filtrada por ID del huésped.
- Creación de reservas con huésped nuevo o existente; las consultas y resultados conectados no se escriben en los almacenes locales de demo.
- Detalle: asignar/cambiar habitación, vista previa de cancelación, cancelar, registrar huéspedes adicionales y check-in.
- Consulta de reservas asociadas a una habitación; enlace al detalle completo.
- Cuenta y check-out enlazados al flujo conectado existente, con cargos, anulación, cierre y factura.
- Incidencias: reporte y fotografía por las conexiones existentes. Se explica la restricción del listado para Recepción.
- Login: Suspense para permitir el prerenderizado sin cambiar el diseño.

## Sin soporte o permisos para Recepción

- Chat y objetos olvidados: no hay endpoints implementados en el backend revisado. Se conservan sus pantallas y datos locales con una indicación visible; las acciones locales no se presentan como sincronizadas.
- Edición del perfil de huéspedes: solo existen GET de búsqueda y POST de registro. No se inventó PATCH/PUT ni se habilitó una edición que no pueda persistir.
- Consulta, toma y resolución de incidencias: GET es para ADMIN o Mantenimiento; tomar/resolver requiere Mantenimiento. Recepción conserva el reporte autorizado.
- La ruta de solicitudes de Recepción remite a Incidencias según el comportamiento previo. Las colas y acciones de limpieza pertenecen al área LIMPIEZA/AMBAS, no a RECEPCION; no se amplían permisos.

## Probar cuando llegue un enlace activo

Configurar API_URL en el servidor para el nuevo enlace y conservar STAFF_AUTH_MODE=spring. No poner JWT en el navegador ni en URLs.

1. Login RECEPCION, contraseña temporal, renovación de sesión y cierre. Verificar que ADMIN/otros roles no accedan a acciones de Recepción.
2. Calendario y lista: filtros, paginación, selección de reserva y actualización tras cerrar su detalle.
3. Buscar huéspedes por nombre, documento y correo; registrar uno nuevo y reutilizar uno existente. Confirmar que el historial incluye todas las páginas y solo las reservas de ese ID.
4. Disponibilidad: fechas válidas/inválidas, cantidad, categoría, cotización real y habitaciones del rango. Crear con huésped nuevo/existente, con/sin asignación; comprobar el resultado por búsqueda antes de repetir tras un timeout.
5. Asignar/cambiar habitación y confirmar conflictos de disponibilidad, tipo, estado y concurrencia. Consultar todas las reservas de una habitación.
6. Cancelación: vista previa y motivo, estados permitidos y rechazo de reservas de canal. Verificar saldo, reembolso y liberación en el backend.
7. Huéspedes adicionales: validar documento, capacidad, duplicados y estado; comprobar el detalle actualizado.
8. Check-in: fecha, habitación libre y limpia, conflictos y nueva ocupación. Confirmar el resultado en calendario, detalle y habitaciones.
9. Cuenta: consultar, agregar/anular cargos, motivos, saldo, bloqueo de pedidos pendientes y check-out. Verificar cierre, pago exacto, factura, impresión/descarga y enlace firmado vigente.
10. Incidencias: reporte con/sin foto, errores de formato/tamaño, condición de habitación y prohibición de listar/resolver con RECEPCION.
11. Errores 400/401/403/409/502 y conexión interrumpida: conservar formulario, mostrar errores reales, no repetir escrituras automáticamente ni mostrar datos demo.
12. Comparar visualmente el diseño aprobado en escritorio y móvil; verificar textos, formularios, diálogos y pantallas locales de chat/objetos.

## Comprobaciones locales

- `pnpm check`: TypeScript e i18n correctos.
- Suite BFF: 100 pruebas aprobadas, incluida cobertura de las conexiones mediante transporte falso, sin backend.
- Suite de cuenta: 10 pruebas aprobadas.
- Build de producción: aprobado después de envolver el login del personal en Suspense; advertencia de múltiples lockfiles ya presentes en el workspace.
- Se corrigió una prueba antigua que usaba demo123, credencial que el proyecto rechaza, para usar VillaSerena26.
- La validación de integración y la comparación visual con el backend activo quedan pendientes; las pruebas locales no acreditan una conexión remota operativa.
