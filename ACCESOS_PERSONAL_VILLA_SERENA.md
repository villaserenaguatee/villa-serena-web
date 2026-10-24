# Accesos reales del personal — Villa Serena PMS

Estado comprobado el 23 de octubre de 2026. Esta entrega se refiere exclusivamente a la web publicada y al API real; no acredita ni utiliza accesos demo.

Inicio de sesión de las cinco cuentas: https://villa-serena-web.vercel.app/login

API: https://api.villaserenaguate.lat

| Nombre exacto | Correo | Rol | Estado de acceso real |
| --- | --- | --- | --- |
| Elena Ortiz | admin@villaserena.gt | Administrador | PENDIENTE: existencia y acceso no verificables sin sesión ADMIN |
| Diego Castillo | recepcion@villaserena.gt | Recepción | PENDIENTE: existencia y acceso no verificables sin sesión ADMIN |
| Isabel Romero | limpieza@villaserena.gt | Limpieza | PENDIENTE: existencia y acceso no verificables sin sesión ADMIN |
| Daniel Fuentes | mantenimiento@villaserena.gt | Mantenimiento | PENDIENTE: existencia y acceso no verificables sin sesión ADMIN |
| Mateo Ríos | roomservice@villaserena.gt | Room Service | PENDIENTE: existencia y acceso no verificables sin sesión ADMIN |

## Evidencia de producción, solo lectura

- GET web /login: 200.
- GET web /api/auth/yo sin sesión: 401 SESION_VENCIDA.
- GET API /actuator/health: 200, UP. Esto no verifica todas las operaciones del API.
- GET API /api/v1/admin/empleados sin sesión: 401 NO_AUTENTICADO. No permite determinar qué cuentas existen.
- GET web /api/publico/hotel y GET API /api/v1/publico/hotel: ambos 404 HOTEL_NO_CONFIGURADO. Las respuestas son compatibles con la conexión esperada; no se inspeccionaron las variables privadas de Vercel para certificar el destino configurado.

## Procedimiento existente

El frontend implementa inicio unificado en /api/auth/iniciar-sesion. Para personal, el adaptador Spring utiliza POST /api/v1/auth/login. El servidor web conserva la sesión mediante cookies HttpOnly; no se deben compartir tokens.

La gestión oficial contempla GET/POST /api/v1/admin/empleados y el restablecimiento administrativo POST /api/v1/admin/empleados/{id}/restablecer-contrasena. La consulta pública sin sesión no certifica que estas operaciones estén implementadas en el despliegue: se comprobarán con ADMIN antes de usarlas.

CrearEmpleadoPeticion requiere nombreCompleto, correo, telefono y rol, con area según corresponda. Roles técnicos: ADMIN, RECEPCION, ROOM_SERVICE y MANTENIMIENTO_LIMPIEZA; este último necesita LIMPIEZA para Isabel y MANTENIMIENTO para Daniel. Para los otros tres, area es null.

No se ha inventado ningún teléfono. Faltan los cinco teléfonos autorizados.

## Contraseñas y recuperación

Si el endpoint oficial está disponible, el backend genera la contraseña temporal y la devuelve una sola vez. La ventana existente TemporaryEmployeeAccess permite entregarla por un canal privado sin almacenarla en este documento. No se generarán contraseñas desde el frontend.

El empleado inicia sesión en la web publicada y completa /panel/cambiar-contrasena cuando el backend indique cambio obligatorio. Si una cuenta ya existe, no se cambiará su contraseña ni su identidad automáticamente. Cualquier restablecimiento necesita autorización específica y soporte comprobado del API desplegado.

La recuperación por correo requiere buzones operativos y envío configurado. No se ha verificado la existencia de los cinco buzones @villaserena.gt. Registrar empleados no crea buzones. El dominio villaserenaguate.lat no es el mismo que villaserena.gt.

## Pendientes que requieren intervención

1. Ubicación de una sesión ADMIN de producción autorizada o mecanismo seguro de acceso. No enviar contraseñas ni tokens en el chat.
2. Los cinco teléfonos exigidos por el contrato.
3. Una vez consultadas las cuentas y confirmados permisos, autorización expresa para crear únicamente las ausentes en producción. No se ejecutará ninguna escritura antes.
4. Canal privado para entregar las contraseñas temporales a sus destinatarios.
5. Verificación del proveedor de correo si se desea utilizar recuperación por email.

No se han creado cuentas ni se ha probado el login de estos cinco usuarios en producción: faltan las credenciales autorizadas. No se modificaron backend, infraestructura, diseño, configuración ni datos. No se hicieron commits ni PR.
