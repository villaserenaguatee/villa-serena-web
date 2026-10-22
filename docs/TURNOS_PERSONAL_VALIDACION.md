# Turnos de Personal — validación frontend

Fuente: HU-ADM-12 y OpenAPI oficial docs 77225a1. Integración tipada con los DTO existentes; la adopción general del contrato permanece en la PR #76.

- Catálogo: GET/POST admin/turnos, PATCH admin/turnos/{id}, POST admin/turnos/{id}/desactivar. No se inventa reactivación.
- Asignaciones: GET admin/asignaciones-turnos con inicio/fin; POST con empleadoId, turnoId y fechas; DELETE por id con confirmación.
- Horas distintas, formato HH:mm, cruces de medianoche permitidos. Empleados activos no ADMIN y turnos activos; solapamientos y atomicidad los decide el servidor.
- Vista de siete días por empleado. Turnos informativos: no alteran autenticación ni permisos. Carga independiente de las operaciones laborales anteriores.
- Bloqueo de envíos simultáneos. Una respuesta incierta exige actualizar el estado antes de volver a guardar; no se crea otra solicitud automáticamente.

## Comprobaciones

8 pruebas enfocadas de Turnos y 16 regresiones existentes de disponibilidad/Personal: pasan. TypeScript, lint de producción modificado, i18n y build: pasan. Las pruebas utilizan respuestas controladas; no crean empleados ni registros reales.

## Validaciones futuras con backend

Persistencia, permisos ADMIN, conflictos entre sesiones y cambios atómicos de varias fechas. No se ejecutaron servicios reales. Las PR existentes no se fusionan ni despliegan.
